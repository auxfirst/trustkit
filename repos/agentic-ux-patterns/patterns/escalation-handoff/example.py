# SPDX-License-Identifier: MIT
"""Escalation Handoff — minimal runnable example.

A blocked situation produces a route with a context packet and the agent's
position. Refusal happens only when no route exists — and says so.

Run with: python example.py
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union


@dataclass
class Situation:
    goal: str
    blocker: str
    gathered: List[str] = field(default_factory=list)
    would_have_done: str = ""
    user_asked_for_human: bool = False
    attempts: int = 1

    def kind(self) -> str:
        """The routable category, e.g. "refund" from "refund: order 4831"."""
        return self.goal.split(":")[0].strip()


@dataclass
class Route:
    destination: str
    eta: str
    # Human-readable authority, for the first line: "that needs <authority>".
    authority: str


@dataclass
class Handoff:
    to: str
    packet: List[str]
    agent_position: str
    blocker: str
    eta: str
    authority: str

    def render(self) -> str:
        lines = [f"I can't {self.blocker} — that needs {self.authority}.", ""]
        lines.append(f"I've routed this to the {self.to} with everything so far:")
        lines += [f"  · {item}" for item in self.packet]
        if self.agent_position:
            lines.append(f"  · my read: {self.agent_position}")
        lines.append("")
        lines.append(f"Typical response: {self.eta}. You don't need to repeat any of it.")
        return "\n".join(lines)


@dataclass
class Refusal:
    blocker: str
    no_route_because: str

    def render(self) -> str:
        return (
            f"I can't {self.blocker}, and there's no one I can route this to: "
            f"{self.no_route_because}.\n"
            "Saying so rather than leaving you waiting on a queue that won't answer."
        )


Outcome = Union[Handoff, Refusal]


class Policy:
    """Routes are data, not conditionals scattered through the agent."""

    def __init__(self, routes: Dict[str, Route]) -> None:
        self.routes = routes

    def route_for(self, s: Situation) -> Optional[Route]:
        if s.user_asked_for_human:
            return self.routes.get("human_requested")
        if s.attempts >= 2:
            return self.routes.get("repeated_failure")
        return self.routes.get(s.kind())

    def why_no_route(self, s: Situation) -> str:
        return f"nothing in this workspace is authorised for '{s.blocker}'"


def handle(situation: Situation, policy: Policy) -> Outcome:
    route = policy.route_for(situation)
    if route is None:
        return Refusal(situation.blocker, policy.why_no_route(situation))
    return Handoff(
        to=route.destination,
        packet=situation.gathered,
        agent_position=situation.would_have_done,
        blocker=situation.blocker,
        eta=route.eta,
        authority=route.authority,
    )


# ---- demo ----
if __name__ == "__main__":
    policy = Policy(
        {
            "refund": Route("Billing supervisor queue", "under 2 hours", "a supervisor"),
            "human_requested": Route("on-call support agent", "under 15 minutes", "a person"),
            "repeated_failure": Route("technical support queue", "same day", "technical support"),
        }
    )

    blocked_by_limit = Situation(
        goal="refund: order 4831",
        blocker="approve a refund above £500",
        gathered=[
            "order #4831, £780, purchased 12 days ago",
            "policy check: within the 30-day window",
        ],
        would_have_done="this qualifies; the only blocker is the amount",
    )

    no_route = Situation(
        goal="contract_amendment: clause 7",
        blocker="amend a signed contract",
        gathered=["customer asked to strike the auto-renewal clause"],
    )

    for label, s in [("blocked by a limit", blocked_by_limit), ("nothing to route to", no_route)]:
        print(f"— {label} —")
        print(handle(s, policy).render())
        print()
