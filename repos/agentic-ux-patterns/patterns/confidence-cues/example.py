# SPDX-License-Identifier: MIT
"""Confidence Cues — minimal runnable example.

The band is computed from evidence, never from phrasing, and the renderer has
no template for asserting an unsupported claim.

Run with: python example.py
"""
from dataclasses import dataclass, field
from typing import List, Literal

Band = Literal["grounded", "inferred", "unsupported"]

# One place to tune and audit. Never inline these.
STRONG_SCORE = 0.75
AGREEMENT_SCORE = 0.60
MIN_AGREEING_SOURCES = 2


@dataclass
class Evidence:
    source: str
    score: float
    quote: str = ""


@dataclass
class Claim:
    text: str
    support: List[Evidence] = field(default_factory=list)
    # What the agent would need to answer this, when it cannot.
    resolved_by: str = ""
    # Set for values the agent computed itself; these are not banded.
    deterministic: bool = False


def band(claim: Claim) -> Band:
    if not claim.support:
        return "unsupported"
    best = max(e.score for e in claim.support)
    agreeing = len({e.source for e in claim.support if e.score >= AGREEMENT_SCORE})
    if best >= STRONG_SCORE and agreeing >= MIN_AGREEING_SOURCES:
        return "grounded"
    return "inferred"


def render(claim: Claim) -> str:
    """Each band gets its own surface. There is deliberately no branch that
    renders an unsupported claim as an assertion."""
    if claim.deterministic:
        return claim.text

    b = band(claim)
    if b == "grounded":
        cites = ", ".join(sorted({e.source for e in claim.support}))
        return f"{claim.text}\n    source: {cites}"
    if b == "inferred":
        best = max(claim.support, key=lambda e: e.score)
        return (
            f"Probably: {claim.text}\n"
            f"    inferred from {best.source} — not stated directly there."
        )
    needed = claim.resolved_by or "a source I don't currently have access to"
    return f"I don't have support for this.\n    To answer it I'd need: {needed}"


# ---- demo ----
if __name__ == "__main__":
    claims = [
        Claim(
            "The refund window is 30 days.",
            support=[
                Evidence("policy/refunds.md", 0.91, "customers may request a refund within 30 days"),
                Evidence("support/macros.yaml", 0.82, "30-day refund"),
            ],
        ),
        Claim(
            "This customer is on the legacy plan.",
            support=[Evidence("crm/notes", 0.55, "migrated 2023, plan field empty")],
        ),
        Claim(
            "Enterprise customers get a 90-day window.",
            resolved_by="the enterprise addendum, which is not in the indexed corpus",
        ),
        Claim("14 days after March 3rd is March 17th.", deterministic=True),
    ]

    for c in claims:
        label = "computed" if c.deterministic else band(c)
        print(f"[{label}]")
        print(f"  {render(c)}\n")
