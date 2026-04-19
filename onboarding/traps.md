# Common ways this goes wrong

Six traps. Review before every release.

1. **Framework zoo.** Sprawl beats depth. More repos is not more credibility. Stop at five for 90 days.
2. **Tutorials in disguise.** A README that teaches the field is a tutorial. Readers came for the standard, not a course.
3. **Unnamed failures.** "It feels off" is not a gap. If we cannot name it, it does not enter the taxonomy.
4. **Opinions without benchmarks.** A teardown without a reproducible transcript is a think-piece. Reject.
5. **Renaming without a migration note.** IDs are load-bearing. Every rename ships with a CHANGELOG entry and an updated example in every downstream repo.
6. **Drift between internal and public.** If the internal audit uses a rule the public YAML doesn't have, we've forked our own standard. Resync before shipping anything new.
