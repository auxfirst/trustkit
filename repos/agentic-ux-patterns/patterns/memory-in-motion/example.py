# SPDX-License-Identifier: MIT
"""Memory in Motion — minimal runnable example.

Run with: python example.py
"""
import sys
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional


@dataclass
class Delta:
    added: Dict[str, str] = field(default_factory=dict)
    changed: Dict[str, str] = field(default_factory=dict)

    def is_empty(self) -> bool:
        return not (self.added or self.changed)

    def summary(self) -> str:
        parts = []
        for k, v in self.added.items():
            parts.append(f'{k.replace("_", " ")} → {v}')
        for k, v in self.changed.items():
            parts.append(f'{k.replace("_", " ")} → {v}')
        return "; ".join(parts)


def diff(current: Dict[str, str], new: Dict[str, str]) -> Delta:
    d = Delta()
    for k, v in new.items():
        if k not in current:
            d.added[k] = v
        elif current[k] != v:
            d.changed[k] = v
    return d


class Memory:
    def __init__(self):
        self._store: Dict[str, Dict[str, str]] = {}

    def get(self, user: str) -> Dict[str, str]:
        return self._store.setdefault(user, {})

    def update(self, user: str, new_facts: Dict[str, str]) -> None:
        self._store[user].update(new_facts)

    def forget(self, user: str, keys: List[str]) -> None:
        for k in keys:
            self._store[user].pop(k, None)


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


def notify(user: str, text: str, actions: List[str]) -> Optional[str]:
    print(f"  💡 {text}")
    print(f"     [{'] ['.join(actions)}]")
    return _prompt(f"     action ({'/'.join(actions + ['skip'])})> ", default="skip")


def memory_in_motion(
    new_fact: Dict[str, str],
    user: str,
    memory: Memory,
    notify_fn: Callable,
) -> None:
    current = memory.get(user)
    delta = diff(current, new_fact)
    if delta.is_empty():
        return

    memory.update(user, new_fact)
    reply = notify_fn(
        user,
        f"Got it — I'll remember: {delta.summary()}.",
        actions=["edit", "forget"],
    )
    if reply == "forget":
        memory.forget(user, list(delta.added) + list(delta.changed))
    elif reply == "edit":
        k = _prompt("     which key?> ", default=next(iter(delta.added), ""))
        v = _prompt(f"     new value for {k}?> ", default="(unchanged)")
        memory.update(user, {k: v})


# ---- demo ----
if __name__ == "__main__":
    m = Memory()
    user = "emil"

    print("First capture:")
    SCRIPT[:] = ["skip"]
    memory_in_motion({"language_preference": "British English"}, user, m, notify)

    print("\nUpdate, then the user corrects it inline:")
    SCRIPT[:] = ["edit", "response_style", "brief but warm"]
    memory_in_motion({"language_preference": "British English", "response_style": "terse"}, user, m, notify)

    print("\nFinal memory:", m.get(user))
