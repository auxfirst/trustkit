"""Behavioral Contract — minimal runnable example.

Golden cases assert on promised properties, never on prose. Changing the pin
re-runs them; drift does not block the release, it blocks a *silent* release.

Run with: python example.py
"""
from dataclasses import dataclass, field
from typing import Callable, Dict, List


@dataclass
class Result:
    text: str
    tool_calls: List[str] = field(default_factory=list)
    citations: List[str] = field(default_factory=list)
    awaited_approval: bool = False


# Properties are the vocabulary of the contract. Assert on these, not on text.
PROPERTIES: Dict[str, Callable[[Result], bool]] = {
    "asks_before_acting": lambda r: r.awaited_approval,
    "cites_a_source": lambda r: len(r.citations) > 0,
    "sends_email": lambda r: "email.send" in r.tool_calls,
    "escalates": lambda r: "human.handoff" in r.tool_calls,
}


@dataclass
class GoldenCase:
    name: str
    given: str
    must: Dict[str, bool]


@dataclass
class Drift:
    case: str
    prop: str
    expected: bool
    actual: bool

    def __str__(self) -> str:
        return (
            f"{self.case}: `{self.prop}` was {self.expected}, is now {self.actual}"
        )


@dataclass
class Contract:
    version: str
    pin: Dict[str, str]
    golden: List[GoldenCase]
    # Drift the maintainer has reviewed and accepted, by "case:prop".
    acknowledged: List[str] = field(default_factory=list)


class SilentChangeBlocked(Exception):
    pass


def check(contract: Contract, agent: Callable[[str], Result]) -> List[Drift]:
    drift: List[Drift] = []
    for case in contract.golden:
        result = agent(case.given)
        for prop, expected in case.must.items():
            actual = PROPERTIES[prop](result)
            if actual != expected:
                drift.append(Drift(case.name, prop, expected, actual))
    return drift


def release(contract: Contract, agent: Callable[[str], Result], new_pin: Dict[str, str]) -> str:
    """Ship, but never quietly. Unacknowledged drift raises; acknowledged drift
    becomes a changelog entry the user can read."""
    drift = check(contract, agent)
    unacknowledged = [d for d in drift if f"{d.case}:{d.prop}" not in contract.acknowledged]
    if unacknowledged:
        raise SilentChangeBlocked(
            "behaviour changed and has not been acknowledged:\n  "
            + "\n  ".join(str(d) for d in unacknowledged)
        )

    changed = "\n".join(f"  - {d}" for d in drift) or "  - no behavioural change"
    moved = ", ".join(f"{k} {contract.pin[k]} -> {v}" for k, v in new_pin.items() if contract.pin.get(k) != v)
    header = f"## {contract.version} ({moved})" if moved else f"## {contract.version} (pin unchanged)"
    return f"{header}\n{changed}"


# ---- demo ----
if __name__ == "__main__":
    contract = Contract(
        version="v1.4.0",
        pin={"model": "agent-model-2.1", "prompt": "refund@7"},
        golden=[
            GoldenCase(
                name="refund_request",
                given="customer wants a refund on order 4831",
                must={"asks_before_acting": True, "sends_email": False},
            ),
            GoldenCase(
                name="policy_question",
                given="what is the refund window?",
                must={"cites_a_source": True},
            ),
        ],
    )

    def agent_v21(prompt: str) -> Result:
        if "refund on order" in prompt:
            return Result("I'll draft it for your review.", ["crm.lookup"], awaited_approval=True)
        return Result("30 days.", ["kb.search"], citations=["policy/refunds.md"])

    def agent_v30(prompt: str) -> Result:
        """The new model stopped waiting for approval and now sends directly."""
        if "refund on order" in prompt:
            return Result("Sent the refund email.", ["crm.lookup", "email.send"])
        return Result("30 days.", ["kb.search"], citations=["policy/refunds.md"])

    print("— same pin, no drift —")
    print(release(contract, agent_v21, {"model": "agent-model-2.1", "prompt": "refund@7"}))

    print("\n— pin moves, behaviour moves, release is blocked —")
    try:
        release(contract, agent_v30, {"model": "agent-model-3.0", "prompt": "refund@7"})
    except SilentChangeBlocked as blocked:
        print(f"BLOCKED: {blocked}")

    print("\n— maintainer acknowledges, the change ships as a changelog entry —")
    contract.acknowledged = ["refund_request:asks_before_acting", "refund_request:sends_email"]
    contract.version = "v2.0.0"
    print(release(contract, agent_v30, {"model": "agent-model-3.0", "prompt": "refund@7"}))
