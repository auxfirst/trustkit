"""Memory Policy Scoping — minimal runnable example.

Ancestors are readable, siblings never are, and out-of-scope hits are withheld
rather than dropped — so the agent can offer a bridge instead of going quiet.

Run with: python example.py
"""
from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional, Tuple


@dataclass(frozen=True)
class Scope:
    """A path the user would recognise, e.g. acme/northgate/proposal."""
    path: str

    def ancestors(self) -> List["Scope"]:
        parts = self.path.split("/")
        return [Scope("/".join(parts[:i])) for i in range(1, len(parts))]

    def __str__(self) -> str:
        return self.path


@dataclass
class Memory:
    text: str
    scope: Scope
    learned_on: date = field(default_factory=date.today)
    # Set when this memory was bridged in from elsewhere. Origin is never lost.
    bridged_from: Optional[Scope] = None


class Store:
    def __init__(self) -> None:
        self._items: List[Memory] = []

    def write(self, text: str, scope: Scope) -> Memory:
        memory = Memory(text, scope)
        self._items.append(memory)
        return memory

    def _search(self, query: str) -> List[Memory]:
        terms = query.lower().split()
        return [m for m in self._items if any(t in m.text.lower() for t in terms)]

    def recall(self, query: str, ctx: Scope) -> Tuple[List[Memory], List[Memory]]:
        """Returns (visible, withheld). Withheld is not an error — it is the
        material for an explicit, one-shot bridge."""
        visible, withheld = [], []
        readable = {ctx, *ctx.ancestors()}
        for m in self._search(query):
            (visible if m.scope in readable else withheld).append(m)
        return visible, withheld

    def bridge(self, memory: Memory, into: Scope) -> Memory:
        """One-shot: copies one named memory, records its origin, opens nothing."""
        copy = Memory(memory.text, scope=into, bridged_from=memory.scope)
        self._items.append(copy)
        return copy


def offer_bridge(withheld: List[Memory], ctx: Scope) -> str:
    if not withheld:
        return ""
    other = withheld[0]
    return (
        f'I have something relevant from "{other.scope}", which is outside '
        f'"{ctx}". Bring it in? [yes] [no]'
    )


# ---- demo ----
if __name__ == "__main__":
    store = Store()
    acme = Scope("acme")
    northgate = Scope("acme/northgate")
    riverbend = Scope("acme/riverbend")

    store.write("House style: no em-dashes in client-facing copy.", acme)
    store.write("Agreed day rate 48k for the Q3 engagement.", northgate)
    store.write("Prefers weekly written updates, not calls.", riverbend)

    print(f"context: {riverbend}\n")
    visible, withheld = store.recall("rate style updates", riverbend)

    print("visible:")
    for m in visible:
        origin = f"  (bridged from {m.bridged_from})" if m.bridged_from else ""
        print(f"  · {m.text}  [{m.scope}]{origin}")

    print("\nwithheld (sibling scope — never read implicitly):")
    for m in withheld:
        print(f"  · {m.text}  [{m.scope}]")

    print(f"\nagent says: {offer_bridge(withheld, riverbend)}")

    print("\n— user says yes —")
    store.bridge(withheld[0], into=riverbend)
    visible, _ = store.recall("rate", riverbend)
    for m in visible:
        origin = f"  (bridged from {m.bridged_from})" if m.bridged_from else ""
        print(f"  · {m.text}  [{m.scope}]{origin}")

    print("\n— the bridge was one-shot: northgate's scope is still closed —")
    _, still_withheld = store.recall("day rate", riverbend)
    print(f"  {len(still_withheld)} memory still withheld from {northgate}")
