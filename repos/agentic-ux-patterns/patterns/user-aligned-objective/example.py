"""User-Aligned Objective — minimal runnable example.

User value and platform value are scored separately and never summed. The user's
ranking wins; divergence is disclosed by naming the option the house preferred
and why it lost.

Run with: python example.py
"""
from dataclasses import dataclass
from typing import Callable, List, Optional


@dataclass
class Plan:
    name: str
    price: float
    included_gb: int
    margin: float          # what the operator earns. Never enters user_value.
    switching_hours: float


@dataclass
class Usage:
    monthly_gb: float


@dataclass
class Objective:
    """Written down, weighted, and inspectable. If you cannot print it,
    you do not have one."""
    weights: dict
    usage: Usage

    def user_value(self, p: Plan) -> float:
        headroom = p.included_gb / max(self.usage.monthly_gb, 0.1)
        # Enough headroom is good; far too much is money wasted, not a benefit.
        fit = 1.0 if 1.5 <= headroom <= 4 else 1 / (1 + abs(headroom - 2.5) / 4)
        cost = 1 / (1 + p.price / 20)
        effort = 1 / (1 + p.switching_hours)
        return (
            self.weights["fit"] * fit
            + self.weights["cost"] * cost
            + self.weights["effort"] * effort
        )

    def platform_value(self, p: Plan) -> float:
        return p.margin

    def describe(self) -> str:
        parts = [f"{k} ({int(v * 100)}%)" for k, v in self.weights.items()]
        return "ranked on: " + ", ".join(parts)


@dataclass
class Recommendation:
    pick: Plan
    diverged: bool
    house_pick: Optional[Plan]
    reason_house_lost: str
    objective: str

    def render(self) -> str:
        lines = [f"Recommended: {self.pick.name} — £{self.pick.price:.0f}/mo", ""]
        if self.diverged and self.house_pick is not None:
            lines.append(
                f"  Heads up: we earn more when you pick {self.house_pick.name} "
                f"(£{self.house_pick.price:.0f}/mo), and on our own numbers it "
                f"doesn't fit. {self.reason_house_lost}"
            )
            lines.append("")
        lines.append(f"  {self.objective}")
        return "\n".join(lines)


def recommend(options: List[Plan], objective: Objective) -> Recommendation:
    user_pick = max(options, key=objective.user_value)
    house_pick = max(options, key=objective.platform_value)
    diverged = user_pick is not house_pick

    reason = ""
    if diverged:
        reason = (
            f"You're using {objective.usage.monthly_gb:.0f}GB of a "
            f"{house_pick.included_gb}GB plan."
        )

    return Recommendation(
        pick=user_pick,
        diverged=diverged,
        house_pick=house_pick if diverged else None,
        reason_house_lost=reason,
        objective=objective.describe(),
    )


# ---- demo ----
if __name__ == "__main__":
    plans = [
        Plan("Meridian Basic", price=18, included_gb=10, margin=0.10, switching_hours=0.5),
        Plan("Meridian Pro", price=29, included_gb=40, margin=0.22, switching_hours=0.5),
        Plan("Northwind Plus", price=42, included_gb=100, margin=0.48, switching_hours=2.0),
    ]

    objective = Objective(
        weights={"fit": 0.6, "cost": 0.3, "effort": 0.1},
        usage=Usage(monthly_gb=4),
    )

    print(recommend(plans, objective).render())

    print("\n— the scores that produced it, kept separate on purpose —")
    print(f"  {'plan':<16} {'user':>6} {'house':>7}")
    for p in plans:
        print(f"  {p.name:<16} {objective.user_value(p):>6.3f} {objective.platform_value(p):>7.2f}")

    print("\n— a heavy user: no divergence, so nothing is disclosed —")
    heavy = Objective(weights=objective.weights, usage=Usage(monthly_gb=60))
    print(recommend(plans, heavy).render())
