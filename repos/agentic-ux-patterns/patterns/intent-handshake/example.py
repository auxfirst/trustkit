# SPDX-License-Identifier: MIT
"""Intent Handshake — minimal runnable example.

Run with: python example.py
"""
import sys
from dataclasses import dataclass
from typing import Callable, List, Literal, Optional

Stakes = Literal["low", "medium", "high", "critical"]


@dataclass
class Step:
    action: str
    reversible: bool = True


@dataclass
class Plan:
    steps: List[Step]
    stakes: Stakes

    def preview(self) -> str:
        bullets = "\n".join(f"  {i+1}. {s.action}" for i, s in enumerate(self.steps))
        will_not = "(nothing will be sent/committed without your ok)" if self.stakes != "low" else ""
        return f"I'll do {len(self.steps)} things:\n{bullets}\n{will_not}".strip()


# ---------------------------------------------------------------------------
# Demo input. At a terminal this prompts a human; with no TTY (CI, a pipe) it
# replays SCRIPT, so the example stays interactive *and* stays runnable
# unattended. Neither the pattern nor its signatures depend on this.
SCRIPT: List[str] = []


def _prompt(tag: str, default: str = "") -> str:
    if sys.stdin.isatty():
        return input(tag).strip().lower()
    reply = SCRIPT.pop(0) if SCRIPT else default
    print(f"{tag}{reply}")
    return reply
# ---------------------------------------------------------------------------


def ask_user(prompt: str, options: List[str]) -> str:
    print(prompt)
    return _prompt(f"{'/'.join(options)}> ", default=options[0])


def intent_handshake(plan: Plan, amend: Callable[[Plan, str], Plan]) -> Optional[Plan]:
    if plan.stakes == "low":
        return plan

    reply = ask_user(plan.preview(), ["ok", "edit", "cancel"])
    if reply == "cancel":
        return None
    if reply == "edit":
        change = _prompt("what should change?> ", default="no change")
        return amend(plan, change)
    return plan


# ---- demo ----
if __name__ == "__main__":
    plan = Plan(
        steps=[
            Step("look up order #4831 in CRM"),
            Step("draft a refund email"),
            Step("queue it for your review (won't send)", reversible=True),
        ],
        stakes="high",
    )

    def amend(p: Plan, change: str) -> Plan:
        p.steps.append(Step(f"(edit) {change}"))
        return p

    SCRIPT[:] = ["edit", "also say the 30-day window was checked"]
    confirmed = intent_handshake(plan, amend)
    print("\n→ executing:")
    for step in (confirmed.steps if confirmed else []):
        print(f"   · {step.action}")
