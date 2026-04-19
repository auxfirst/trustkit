"""Memory in Motion — minimal runnable example.

Run with: python example.py
"""
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


def notify(user: str, text: str, actions: List[str]) -> Optional[str]:
    print(f"  💡 {text}")
    print(f"     [{'] ['.join(actions)}]")
    return input(f"     action ({'/'.join(actions + ['skip'])})> ").strip().lower()


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
        k = input("     which key?> ")
        v = input(f"     new value for {k}?> ")
        memory.update(user, {k: v})


# ---- demo ----
if __name__ == "__main__":
    m = Memory()
    user = "emil"

    print("First capture:")
    memory_in_motion({"language_preference": "British English"}, user, m, notify)

    print("\nUpdate:")
    memory_in_motion({"language_preference": "British English", "response_style": "terse"}, user, m, notify)

    print("\nFinal memory:", m.get(user))
