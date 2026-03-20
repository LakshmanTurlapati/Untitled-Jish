---
status: partial
phase: 10-gamification-and-metrics-dashboard
source: [10-VERIFICATION.md]
started: 2026-03-20T17:55:00Z
updated: 2026-03-20T17:55:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Quiz tab visual layout end-to-end
expected: CompactRankBadge pill visible top-right, SmartQuizPrompt banner (if 5+ at-risk), VocabularyDashboard, QuizModeSelector, MetricsDashboard in that order below
result: [pending]

### 2. MetricsDashboard stat card expansion
expected: Clicking 'Avg Recall' reveals ForgettingCurveChart with TimeRangePills; clicking 'Total Words' reveals VocabGrowthChart; clicking 'Kaavyas Explored' reveals ComprehensionSection
result: [pending]

### 3. Floating +10 XP animation on correct quiz answer
expected: A floating '+10 XP' text element animates upward and fades out within 800ms above the XP counter
result: [pending]

### 4. Rank-up celebration overlay
expected: After completing a quiz that crosses a rank threshold, a full-screen overlay appears with Confetti, 'Rank Up!' heading, and the new Sanskrit rank name; auto-dismisses after 3 seconds
result: [pending]

### 5. XP persistence across page refresh
expected: After completing a quiz, refreshing the page shows the same total XP in CompactRankBadge as before refresh
result: [pending]

### 6. SmartQuizPrompt threshold trigger
expected: Banner only appears when 5 or more vocabulary items have FSRS retrievability below 0.7; banner is absent otherwise
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
