# For people who run a team that uses AI tools daily

*If your team uses AI tools that keep breaking, this is the language to describe what's breaking.*

You don't need to know how the agents are built. You need a shared vocabulary with IT and the vendor — and a short list of questions that will tell you, in one meeting, whether the product is trustworthy or not.

---

## Four stages of trust

Trust isn't a feeling. It's a ladder. Agents earn it one rung at a time — and can lose it all at once.

1. **Functional trust** — *Can it do the basic task reliably?* Same input, same answer, every time.
2. **Contextual trust** — *Does it remember us?* Our preferences, our history, our vocabulary.
3. **Judgment trust** — *Does it call it right when the situation is ambiguous?* Does it escalate when it should?
4. **Advocacy trust** — *Does it act in our interest when its operator's interest differs?*

The sequence matters. An agent that's brilliant at stage 3 but fails stage 1 is untrustworthy — and users will not separate those stages when they feel burnt.

## Six things that break, in plain English

| What you see | What it's called |
|---|---|
| The agent forgets something your team told it last week. | **Memory amnesia** |
| The agent confidently gives a wrong answer. | **Confident nonsense** |
| The agent ignores a preference your team explicitly set. | **Preference ignored** |
| The agent acts on an ambiguous instruction without asking. | **Overreach in ambiguity** |
| The agent recommends the option that benefits the vendor, not you. | **Metric over user** |
| The agent's quality drops after an update — silently. | **Silent degradation** |

These are the ones your support team will recognise.

## 10 questions to ask IT or the vendor

Print this. Take it into your next review.

1. When the agent is wrong, does it say so, or pretend it isn't?
2. If my team tells it a preference today, will it remember next week?
3. What happens when the agent isn't sure — does it ask, guess, or refuse?
4. Who decided what the agent is and is not allowed to do without asking?
5. Where can our team see and edit what the agent remembers about us?
6. After a model or vendor update, how do you check that quality didn't drop?
7. What are the three most common complaints from users, and which of the named failures above map to them?
8. If the vendor's best answer is bad for us, will the agent surface that — or hide it?
9. What's the handoff to a human? How fast? Under what condition?
10. Can you show me one case where the agent was wrong, the fix, and the date it shipped?

## What to do with this

- Walk into your next agent review with the vocabulary above.
- Expect IT to answer in named failures ("that's a memory amnesia issue"), not in vibes.
- If a vendor can't answer Q1, Q6, or Q8 — you have a trust problem, not a tool problem.

## Take this with you

The **[10 questions for your AI vendor](forwardables/A1-10-questions-for-your-ai-vendor.md)** card — one page, forwardable, printable.

---

<sub>**If you're also responsible for reporting to the board →** start with **[R2 · for CTOs](for-ctos.md)**. Back to **[router](README.md)**.</sub>
