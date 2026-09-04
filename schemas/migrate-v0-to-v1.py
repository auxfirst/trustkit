#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Migrate an agent spec from the v0.1.0 format to v1.0.

    python3 schemas/migrate-v0-to-v1.py my-agent.yaml
    python3 schemas/migrate-v0-to-v1.py my-agent.yaml --out-dir ./specs

Writes two files next to the input (or into --out-dir):

    <name>.agent-spec.yaml     the v1.0 spec, with TODO markers
    <name>.memory-policy.yaml  the memory block, moved to its own document

and prints a report of every decision the conversion could not make for you.

This tool deliberately does not guess. Three things in v0 cannot be mechanically
converted, because converting them is the work:

  autonomy    A single per-agent label becomes a per-action mandate. There is
              no arithmetic that turns "human-on-the-loop" into a list of what
              the agent may decide alone. Every tool becomes a mandate row you
              have to rule on.

  guarantees  Free-text promises become mandate rows with an enforcing
              mechanism. "Will always ask before sending external email" is a
              sentence; the send scope being withheld until approval is a
              control. Only you know which one you actually have.

  heat        Scoring an action on reversibility, blast radius, exposure,
              commitment and authority requires knowing what the action does in
              your systems.

Exit code 0 if the file converted, 1 on a read or parse failure. A conversion
that leaves TODOs still exits 0 — the TODOs are the point, not an error.

MIT · auxfirst agency 2026
"""
import argparse
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.exit("pyyaml is required: pip install pyyaml")

TODO = "TODO"

# v0 autonomy label -> the honest v1 reading of it
AUTONOMY_HINT = {
    "human-in-the-loop": (
        "every step was confirmed, so most rows are probably human_approval; "
        "the read-only ones are candidates for autonomous"
    ),
    "human-on-the-loop": (
        "review was batched, so rows are probably a mix of autonomous (reads, "
        "drafts) and human_approval (anything that leaves the building)"
    ),
    "autonomous": (
        "nothing was gated, so every row needs a deliberate decision — this is "
        "the case where the migration is most likely to surface a surprise"
    ),
}

RETENTION_RE = re.compile(r"^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$")


def iso_duration_to_days(value):
    """Best-effort ISO-8601 duration to days. Returns None if unparseable."""
    if not isinstance(value, str):
        return None
    match = RETENTION_RE.match(value.strip())
    if not match:
        return None
    years, months, days = (int(g) if g else 0 for g in match.groups())
    return years * 365 + months * 30 + days


def slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return slug or "agent"


def convert(v0, source_name):
    notes = []
    todos = []

    name = v0.get("name") or source_name
    slug = slugify(name)

    spec = {
        "spec_version": "1.0",
        "id": slug,
        "name": name,
    }

    if v0.get("version"):
        spec["version"] = str(v0["version"])
    if v0.get("surface"):
        spec["surface"] = v0["surface"]

    spec["purpose"] = f"{TODO}: why this agent exists, in business terms, in one sentence."
    todos.append("purpose — v0 had no equivalent field")

    spec["owners"] = {
        "business": {"name": f"{TODO}: a named person in the business function"},
        "technical": {"name": f"{TODO}: a named person who can change how it works"},
    }
    todos.append("owners — two named people, not a team. v0 recorded neither")

    spec["trigger"] = {"kind": f"{TODO}", "detail": f"{TODO}: what starts a run"}
    todos.append("trigger — one of schedule, event, user_invocation, escalation, continuous")

    spec["systems"] = {
        "data_sources": [f"{TODO}: what it reads"],
        "connected": [
            {
                "name": f"{TODO}: system name",
                "auth": f"{TODO}: own_identity, delegated_identity, oauth_user or service_account",
            }
        ],
    }
    todos.append("systems — v0 listed tools but not the systems behind them or how the agent authenticates")

    spec["capability"] = {
        "can_read": [f"{TODO}: what the credentials permit reading"],
        "can_change": [f"{TODO}: what the credentials permit changing"],
    }
    todos.append(
        "capability — what the credentials PERMIT, which is usually broader than "
        "the mandate. The difference is the attack surface"
    )

    # --- the mandate, from tools and guarantees ---------------------------
    mandate = []
    tools = v0.get("tools") or []
    for tool in tools:
        mandate.append(
            {
                "action": f"Call {tool}",
                "authority": f"{TODO}: autonomous | human_approval | human_only | prohibited",
                "enforced_by": f"{TODO}: the mechanism, not the intention",
            }
        )
    guarantees = v0.get("guarantees") or []
    for guarantee in guarantees:
        mandate.append(
            {
                "action": f"{TODO}: name the action behind this promise",
                "authority": f"{TODO}",
                "enforced_by": f"{TODO}: what makes this true when the prompt is ignored?",
                "_from_v0_guarantee": guarantee,
            }
        )
    if not mandate:
        mandate.append(
            {
                "action": f"{TODO}: one verb the agent can reach",
                "authority": f"{TODO}",
                "enforced_by": f"{TODO}",
            }
        )
    spec["mandate"] = mandate

    autonomy = v0.get("autonomy")
    if autonomy:
        hint = AUTONOMY_HINT.get(autonomy, "no hint available for this value")
        notes.append(
            f'autonomy: "{autonomy}" was a single label for the whole agent and has '
            f"no v1 equivalent. Reading it: {hint}."
        )
        todos.append(
            f"mandate — {len(tools)} row(s) from tools and {len(guarantees)} from "
            f'guarantees, all needing an authority and a mechanism. The v0 label '
            f'"{autonomy}" is a starting hypothesis, not an answer'
        )
    if guarantees:
        notes.append(
            f"{len(guarantees)} guarantee(s) were carried across as mandate rows with the "
            "original text preserved in _from_v0_guarantee. Remove that key once the row "
            "is filled in — the schema rejects it."
        )

    spec["human_control"] = {
        key: {"available": f"{TODO}: true or false", "mechanism": f"{TODO}"}
        for key in ("observe", "interrupt", "approve", "override", "disable")
    }
    todos.append("human_control — five forms. v0 recorded none of them explicitly")

    spec["exceptions"] = [
        {
            "condition": f"{TODO}: one of the nine conditions",
            "response": f"{TODO}: retry | stop | ask_human | route | fallback | log | refuse",
            "escalation": {
                "recipient": f"{TODO}: a named human",
                "deadline_minutes": f"{TODO}",
                "on_timeout": f"{TODO}: stop | fallback | refuse | page_secondary",
            },
        }
    ]
    todos.append("exceptions — v0 had no failure design at all")

    spec["shutdown"] = {
        "procedure": f"{TODO}: how the agent is stopped and its access revoked",
        "tested": False,
    }
    todos.append("shutdown — and tested must become true before this is production")

    if v0.get("evaluation"):
        notes.append(
            "evaluation.golden_transcripts and failure_transcripts were not carried "
            "over. They belong to the evaluation suite artifact, not the agent spec. "
            "Keep the paths."
        )
    if v0.get("flows"):
        notes.append(
            f"{len(v0['flows'])} flow path(s) were not carried over. Flows belong to "
            "the storyboard artifact."
        )

    # --- memory, moved to its own document --------------------------------
    memory_doc = None
    mem = v0.get("memory") or {}
    if mem:
        ttl = iso_duration_to_days(mem.get("retention"))
        if ttl is None and mem.get("retention"):
            notes.append(
                f'memory.retention "{mem["retention"]}" could not be parsed as an '
                "ISO-8601 duration; ttl_days left as TODO."
            )
        memory_doc = {
            "schema": "memory-policy",
            "version": "1.0.0",
            "agent": slug,
            "classes": [
                {
                    "id": "semantic",
                    "persistent": bool(mem.get("persistent", False)),
                    "ttl_days": ttl if ttl is not None else f"{TODO}",
                    "editable": bool(mem.get("user_editable", False)),
                    "must_be_visible": bool(mem.get("user_visible", False)),
                }
            ],
            # v0 `scopes` are content categories, not scope levels. They are
            # different axes and must not be conflated: levels say how far a
            # memory may travel, categories say what is retained.
            "retained_categories": mem.get("scopes") or [f"{TODO}: what is retained"],
            "scope": {
                "levels": ["user", "team", "tenant", "global"],
                "default": f"{TODO}: how far may these travel? v0 did not record this",
            },
            "user_rights": {
                "inspect": {"required": bool(mem.get("user_visible", False))},
                "correct": {"required": bool(mem.get("user_editable", False))},
                "forget": {"required": f"{TODO}: v0 had no forget control"},
            },
        }
        if not mem.get("user_visible", False):
            notes.append(
                "memory.user_visible was false. Under memory-policy.yaml the semantic "
                "class must be visible — this is a gap to close, recorded rather than "
                "silently upgraded."
            )
        todos.append("memory policy — forget control, sensitive categories and provenance")
        todos.append(
            "memory scope.default — v0 recorded content categories but never how far "
            "a memory may travel. A memory with no scope level is a context leak "
            "waiting to be found (tg.contextual.context_leak)"
        )

    return spec, memory_doc, notes, todos


def dump(doc, path, header):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(header)
        yaml.safe_dump(doc, fh, sort_keys=False, allow_unicode=True, width=88)


def main():
    parser = argparse.ArgumentParser(description="Migrate a v0.1.0 agent spec to v1.0.")
    parser.add_argument("spec", help="path to the v0 spec")
    parser.add_argument("--out-dir", default=None, help="where to write (default: alongside input)")
    args = parser.parse_args()

    try:
        with open(args.spec, encoding="utf-8") as fh:
            v0 = yaml.safe_load(fh)
    except Exception as exc:                                     # noqa: BLE001
        sys.exit(f"cannot read {args.spec}: {exc}")
    if not isinstance(v0, dict):
        sys.exit(f"{args.spec} does not contain a YAML mapping")

    # The v0 example block is a string; a real v0 spec is the mapping itself.
    if "example" in v0 and "name" not in v0:
        sys.exit(
            f"{args.spec} looks like the v0 format DEFINITION, not an agent spec "
            "written in it. Pass one of your own specs."
        )

    out_dir = args.out_dir or os.path.dirname(os.path.abspath(args.spec))
    os.makedirs(out_dir, exist_ok=True)

    spec, memory_doc, notes, todos = convert(v0, os.path.basename(args.spec))
    slug = spec["id"]

    spec_path = os.path.join(out_dir, f"{slug}.agent-spec.yaml")
    dump(
        spec,
        spec_path,
        "# Migrated from the v0.1.0 agent spec format.\n"
        "# Every TODO is a decision the conversion could not make for you.\n"
        "# Validate with: python3 schemas/validate.py " + f"{slug}.agent-spec.yaml\n\n",
    )
    written = [spec_path]

    if memory_doc:
        mem_path = os.path.join(out_dir, f"{slug}.memory-policy.yaml")
        dump(
            memory_doc,
            mem_path,
            "# Memory block extracted from the v0.1.0 agent spec.\n"
            "# Memory governance lives in its own document — see\n"
            "# schemas/memory-policy.schema.yaml.\n\n",
        )
        written.append(mem_path)

    print(f"read  {args.spec}")
    for path in written:
        print(f"wrote {path}")

    if notes:
        print("\nnotes")
        for note in notes:
            print(f"  · {note}")

    print(f"\n{len(todos)} decision(s) the conversion could not make")
    for todo in todos:
        print(f"  TODO {todo}")

    print(
        "\nThe converted file will not validate until the TODOs are resolved. "
        "That is deliberate:\nthe schema refuses a mandate row without an enforcing "
        "mechanism, and refusing it is\nthe whole point of v1.0."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
