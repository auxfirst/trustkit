#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Validate the TrustKit schemas, and any agent specs written against them.

    python3 schemas/validate.py                        # the schemas themselves
    python3 schemas/validate.py specs/*.yaml           # plus agent specs

What it checks:

  1. every .yaml in this directory parses
  2. every file that is a real JSON Schema validates as one (draft 2020-12)
  3. cross-references resolve, for whichever of them the files actually carry
  4. duplicated enums stay in step between agent-spec and trust-architecture
  5. any specs passed on the command line validate against agent-spec.schema.yaml

The cross-reference checks adapt to what is present. Schemas in this repository
have been written at different times in different shapes, so a check whose
source key is missing is reported as skipped rather than failed. Checks that do
run are strict.

`agent-spec.v0.yaml` is recognised as the frozen pre-1.0 format and is not read
as a JSON Schema — it uses `$schema` as a container for a custom notation. See
MIGRATION.md.

Exit code 0 on success, 1 on any failure. Suitable for CI.

MIT · auxfirst agency 2026
"""
import glob
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("pyyaml is required: pip install pyyaml")
try:
    from jsonschema import Draft202012Validator
except ImportError:
    sys.exit("jsonschema is required: pip install jsonschema")

HERE = os.path.dirname(os.path.abspath(__file__))
AGENT_SPEC = "agent-spec.schema.yaml"
V0_SPEC = "agent-spec.v0.yaml"

errors, notes, skipped = [], [], []


def is_json_schema(doc):
    """A real JSON Schema, as opposed to a data document or the v0 format."""
    if not isinstance(doc, dict):
        return False
    if "properties" not in doc and "$defs" not in doc:
        return False
    return isinstance(doc.get("$schema"), str)


def first_list(doc, *keys):
    """Return (key, list) for the first key present holding a list."""
    for key in keys:
        if isinstance(doc.get(key), list):
            return key, doc[key]
    return None, None


def ids(items, *fields):
    out = set()
    for item in items or []:
        if not isinstance(item, dict):
            continue
        for field in fields:
            if item.get(field):
                out.add(item[field])
                break
    return out


# --- 1. parse every yaml in the directory ---------------------------------
docs = {}
for path in sorted(glob.glob(os.path.join(HERE, "*.yaml"))):
    name = os.path.basename(path)
    try:
        with open(path, encoding="utf-8") as fh:
            docs[name] = yaml.safe_load(fh)
    except Exception as exc:                                     # noqa: BLE001
        errors.append(f"{name}: does not parse as YAML — {exc}")

if errors:
    for err in errors:
        print("FAIL", err)
    sys.exit(1)

notes.append(f"parsed {len(docs)} YAML file(s)")

if AGENT_SPEC not in docs:
    errors.append(f"missing {AGENT_SPEC}")

# --- 2. JSON Schema validity ----------------------------------------------
for name, doc in docs.items():
    if name == V0_SPEC:
        if isinstance(doc, dict) and "$schema" in doc and "properties" not in doc:
            notes.append(
                f"{name} present and frozen — not read as JSON Schema "
                "(pre-1.0 custom format, see MIGRATION.md)"
            )
        else:
            errors.append(f"{name} is not in the expected v0 shape")
        continue
    if is_json_schema(doc):
        try:
            Draft202012Validator.check_schema(doc)
            notes.append(f"{name} is a valid JSON Schema (draft 2020-12)")
        except Exception as exc:                                 # noqa: BLE001
            errors.append(f"{name} is not a valid JSON Schema — {exc}")

# --- 3. cross-references, for whichever exist ------------------------------
H = docs.get("aux-heuristics.yaml") or {}
A = docs.get("trust-architecture.yaml") or {}
G = docs.get("trust-gap-taxonomy.yaml") or {}
C = docs.get("trust-contract.yaml") or {}
M = docs.get("memory-policy.yaml") or docs.get("memory-policy.schema.yaml") or {}

_, heuristics = first_list(H, "heuristics")
stage_key, stages = first_list(A, "trust_stages", "stages")
_, levels = first_list(A, "autonomy_levels")
_, gaps = first_list(G, "gaps")
_, families = first_list(G, "families")
_, patterns = first_list(C, "patterns")

hids = ids(heuristics, "id")
tids = ids(stages, "id")
lids = ids(levels, "id")
gids = ids(gaps, "id")
fids = ids(families, "id")
pids = ids(patterns, "id")

def ref_of(item, *keys):
    for key in keys:
        if item.get(key):
            return item[key]
    return None


if hids and gids:
    checked = 0
    for gap in gaps:
        ref = ref_of(gap, "heuristic", "heuristic_ref")
        if not ref:
            continue
        checked += 1
        if ref not in hids:
            errors.append(f"{gap.get('id')} references unknown heuristic {ref}")
    if checked:
        notes.append(
            f"gaps -> heuristics resolve ({checked}/{len(gids)} gaps carry a "
            f"heuristic ref, {len(hids)} heuristics)"
        )
    else:
        skipped.append(
            "gaps -> heuristics (no gap carries `heuristic` or `heuristic_ref`)"
        )
else:
    skipped.append("gaps -> heuristics (one side absent)")

# gaps may name their collapsed stage directly instead of via a family
if tids and gids:
    checked = 0
    for gap in gaps:
        ref = ref_of(gap, "trust_stage", "collapses_stage")
        if not ref:
            continue
        checked += 1
        if ref not in tids:
            errors.append(f"{gap.get('id')} references unknown trust stage {ref}")
    if checked:
        notes.append(f"gaps -> trust stages resolve ({checked}/{len(gids)} gaps carry one)")
    else:
        skipped.append("gaps -> trust stages (no gap names a stage directly)")

if fids and gids:
    for gap in gaps:
        ref = gap.get("family")
        if ref and ref not in fids:
            errors.append(f"{gap.get('id')} references unknown family {ref}")
    notes.append(f"gaps -> families resolve ({len(fids)} families)")
else:
    skipped.append("gaps -> families (no `families` key in trust-gap-taxonomy.yaml)")

if fids and tids:
    for fam in families:
        ref = fam.get("collapses_stage")
        if ref and ref not in tids:
            errors.append(f"{fam.get('id')} references unknown trust stage {ref}")
    notes.append("families -> trust stages resolve")
else:
    skipped.append("families -> trust stages (one side absent)")

if pids:
    for pat in patterns:
        for ref in pat.get("heuristics", []) or []:
            if hids and ref not in hids:
                errors.append(f"pattern {pat.get('id')} references unknown heuristic {ref}")
        for ref in pat.get("fixes_gaps", []) or []:
            if gids and ref not in gids:
                errors.append(f"pattern {pat.get('id')} references unknown gap {ref}")
        for ref in pat.get("requires", []) or []:
            if ref not in pids:
                errors.append(f"pattern {pat.get('id')} requires unknown pattern {ref}")
    notes.append(f"patterns -> heuristics and gaps resolve ({len(pids)} patterns)")
else:
    skipped.append("patterns -> heuristics and gaps (no `patterns` key in trust-contract.yaml)")

if hids and pids:
    for heur in heuristics:
        for ref in heur.get("related_patterns", []) or []:
            if ref not in pids:
                errors.append(f"{heur.get('id')} references unknown pattern {ref}")
        for ref in heur.get("related_gaps", []) or []:
            if gids and ref not in gids:
                errors.append(f"{heur.get('id')} references unknown gap {ref}")

cap = A.get("consequence_cap") or {}
bands = cap.get("bands") if isinstance(cap.get("bands"), dict) else None
if bands and lids:
    for band, spec in bands.items():
        ref = (spec or {}).get("max_autonomy")
        if ref and ref not in lids:
            errors.append(f"band {band} references unknown autonomy level {ref}")
    notes.append(f"heat bands -> autonomy levels resolve ({len(bands)} bands)")
else:
    skipped.append("heat bands -> autonomy levels (no `consequence_cap.bands`)")

if gids and isinstance(M, dict):
    for ref in (
        (M.get("scope") or {}).get("violation_gap"),
        ((M.get("user_rights") or {}).get("correct") or {}).get("related_gap"),
    ):
        if ref and ref not in gids:
            errors.append(f"memory policy references unknown gap {ref}")

# --- 4. duplicated enums stay in step --------------------------------------
S = docs.get(AGENT_SPEC) or {}
props = (S.get("properties") or {})
mandate_items = ((props.get("mandate") or {}).get("items") or {}).get("properties") or {}


def enum_at(node, *path):
    cur = node
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    if isinstance(cur, dict) and isinstance(cur.get("enum"), list):
        return set(cur["enum"])
    return None


checks = [
    ("agent-spec heat.band", enum_at(mandate_items, "heat", "properties", "band"),
     set(bands) if bands else None),
    ("agent-spec autonomy_level", enum_at(mandate_items, "autonomy_level"), lids or None),
    ("agent-spec trust_stage", enum_at(props, "trust_stage"), tids or None),
]
B = docs.get("brain-spec.schema.yaml") or {}
sig = ((B.get("properties") or {}).get("trust_signature") or {}).get("properties") or {}
checks += [
    ("brain-spec trust_signature.stage", enum_at(sig, "stage"), tids or None),
    ("brain-spec trust_signature.autonomy_level", enum_at(sig, "autonomy_level"), lids or None),
]

compared = 0
for label, in_spec, in_arch in checks:
    if in_spec is None or in_arch is None:
        continue
    compared += 1
    if in_spec != in_arch:
        errors.append(
            f"{label} enum {sorted(in_spec)} does not match "
            f"trust-architecture.yaml {sorted(in_arch)}"
        )
if compared:
    notes.append(f"{compared} duplicated enum(s) match trust-architecture ({stage_key or 'n/a'})")
else:
    skipped.append("duplicated enums (nothing comparable found)")

# --- 5. specs from the command line ----------------------------------------
spec_paths = []
for arg in sys.argv[1:]:
    spec_paths.extend(glob.glob(arg))

if spec_paths:
    if not is_json_schema(S):
        errors.append(f"cannot validate specs: {AGENT_SPEC} is not a JSON Schema")
    else:
        validator = Draft202012Validator(S)
        for path in spec_paths:
            try:
                with open(path, encoding="utf-8") as fh:
                    doc = yaml.safe_load(fh)
            except Exception as exc:                             # noqa: BLE001
                errors.append(f"{path}: does not parse — {exc}")
                continue
            found = sorted(validator.iter_errors(doc), key=lambda e: list(map(str, e.path)))
            if found:
                for err in found:
                    where = "/".join(str(p) for p in err.path) or "(root)"
                    errors.append(f"{os.path.basename(path)} :: {where} :: {err.message}")
            else:
                notes.append(f"{os.path.basename(path)} validates against {AGENT_SPEC}")

# --- report -----------------------------------------------------------------
for note in notes:
    print("ok  ", note)
for item in skipped:
    print("skip ", item)
for err in errors:
    print("FAIL", err)

print()
print("FAILED" if errors else "PASSED")
sys.exit(1 if errors else 0)
