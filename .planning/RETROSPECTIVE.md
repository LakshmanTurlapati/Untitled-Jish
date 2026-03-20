# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 -- Sanskrit Learning Platform

**Shipped:** 2026-03-20
**Phases:** 3 | **Plans:** 10 | **Tasks:** 22

### What Was Built
- Kindle-like Kaavya Reader with PDF upload, Shobhika font, and AI comprehension hints backed by pramaana
- FSRS spaced-repetition Quiz Engine with daily/kaavya dual modes and dictionary-only MCQ
- Gamification system with XP/rank (6 Sanskrit-themed tiers) and Recharts-powered metrics dashboard
- Smart quiz prompting based on FSRS retrievability analysis
- Full IndexedDB persistence layer (Dexie v3) for kaavyas, vocabulary, reviews, and user stats

### What Worked
- TDD approach for gamification engines (Phase 10 Plan 01) caught type contract issues early -- 23 tests all green before UI work began
- Wave-based execution with dependency ordering prevented integration issues between data layer -> UI -> wiring
- Smart discuss in autonomous mode captured design decisions efficiently without excessive back-and-forth
- UI-SPEC design contract caught typography and navigation issues before planning (5 font sizes -> 4, 4th tab -> sub-view)

### What Was Inefficient
- Integration checker found an off-by-one bug in kaavya completion detection that spans Phase 8 (useReader) and Phase 10 (completion checks). Cross-phase data contract verification should happen earlier
- Phase 6 (v1.0) missing VERIFICATION.md -- older phases without verification create noise in milestone audits
- Plan checker revision loop needed 2 iterations for Phase 10 -- the planner's "simplify" note in computeGrowthData contradicted its own type definition

### Patterns Established
- Pure-function gamification engines under src/lib/gamification/ -- testable without React
- Dynamic imports with ssr:false for heavy chart components (Recharts)
- Sanskrit-themed naming for rank tiers and UI elements (Shishya, Adhyayin, Vidvan, Pandit, Acharya, Mahavidvan)
- Dexie schema versioning (v1 -> v2 -> v3) for additive table changes

### Key Lessons
1. Cross-phase data contracts (0-indexed vs 1-indexed) need explicit documentation in CONTEXT.md or interface types -- the kaavya completion bug could have been caught at plan time
2. UI-SPEC verification loop is valuable for frontend phases -- caught real issues (font count, navigation decision compliance) before plans were created
3. Integration checker is essential for milestone audits -- found the completion detection bug that unit tests and phase verification both missed

### Cost Observations
- Model mix: 100% opus for execution, sonnet for verification/checking
- 3 phases completed in a single autonomous session
- Notable: Plan checker saved execution time by catching the GrowthDataPoint type mismatch before code was written

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 7 | 3 |
| Plans | 16 | 10 |
| LOC (total) | ~4000 | 9201 |
| Known bugs at ship | 0 | 1 (kaavya completion off-by-one) |
