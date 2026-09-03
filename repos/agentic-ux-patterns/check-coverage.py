#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Enforce the two claims this repo makes about itself.

  1. Every named gap in trust-gap-taxonomy.yaml has a pattern that closes it.
  2. Every pattern ships all four files, and example.py actually runs.

CONTRIBUTING says "a pattern PR is rejected if any of the four files are
missing". This is that rule, executed rather than asserted.

Usage: python repos/agentic-ux-patterns/check-coverage.py
"""
import subprocess
import sys
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PATTERNS = HERE / "patterns"
REQUIRED = ("README.md", "diagram.svg", "example.py", "anti-pattern.md")


def main() -> int:
    taxonomy = yaml.safe_load((REPO / "schemas" / "trust-gap-taxonomy.yaml").read_text())
    gaps = taxonomy["gaps"]
    present = {d.name for d in PATTERNS.iterdir() if d.is_dir()}
    problems: list[str] = []

    # 1. coverage
    uncovered = [g for g in gaps if g["fix_pattern"] not in present]
    for gap in uncovered:
        problems.append(
            f"gap {gap['id']} names fix_pattern '{gap['fix_pattern']}', "
            f"which has no folder under patterns/"
        )

    # An orphan is not an error — a pattern may exist before a gap names it —
    # but it should be deliberate, so say so.
    named = {g["fix_pattern"] for g in gaps}
    orphans = sorted(present - named)

    # 2. completeness and runnability
    for slug in sorted(present):
        for filename in REQUIRED:
            if not (PATTERNS / slug / filename).exists():
                problems.append(f"pattern '{slug}' is missing {filename}")

        example = PATTERNS / slug / "example.py"
        if example.exists():
            run = subprocess.run(
                [sys.executable, example.name],
                cwd=example.parent,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if run.returncode != 0:
                tail = (run.stderr or run.stdout).strip().splitlines()[-1:]
                problems.append(f"pattern '{slug}': example.py exited {run.returncode} — {tail}")

    covered = len(gaps) - len(uncovered)
    print(f"gaps covered: {covered}/{len(gaps)}   patterns: {len(present)}")
    if orphans:
        print(f"patterns not named by any gap (fine, but deliberate?): {', '.join(orphans)}")

    if problems:
        print("\nFAILED:")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print("all gaps closed, all patterns complete, all examples run")
    return 0


if __name__ == "__main__":
    sys.exit(main())
