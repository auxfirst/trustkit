"""Intent Handshake — minimal runnable example.

Run with: python example.py
"""
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


def ask_user(prompt: str, options: List[str]) -> str:
    print(prompt)
    return input(f"{'/'.join(options)}> ").strip().lower()


def intent_handshake(plan: Plan, amend: Callable[[Plan, str], Plan]) -> Optional[Plan]:
    if plan.stakes == "low":
        return plan

    reply = ask_user(plan.preview(), ["ok", "edit", "cancel"])
    if reply == "cancel":
        return None
    if reply == "edit":
        change = input("what should change?> ")
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

    confirmed = intent_handshake(plan, amend)
    print("\n→ executing:", confirmed)
