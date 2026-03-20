---
status: testing
phase: 07-ui-navigation-polish
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md
started: 2026-03-09T17:10:00Z
updated: 2026-03-09T17:10:00Z
---

## Current Test

number: 1
name: Top-Level Tab Navigation
expected: |
  Page shows two tabs at the top: "Analyze" and "Study". Analyze tab is selected by default. Study tab is disabled/grayed out before any analysis is run.
awaiting: user response

## Tests

### 1. Top-Level Tab Navigation
expected: Page shows two tabs at the top: "Analyze" and "Study". Analyze tab is selected by default. Study tab is disabled/grayed out before any analysis is run.
result: [pending]

### 2. Study Tab Enables After Analysis
expected: After running an analysis on Sanskrit text, the Study tab becomes enabled. Clicking it switches to a Study view with Vocabulary and Quiz sub-tabs.
result: [pending]

### 3. Sticky Analyze Button Gated to Analyze Tab
expected: The sticky "Analyze" button at the bottom of the screen is visible on the Analyze tab. Switching to the Study tab hides the sticky button completely.
result: [pending]

### 4. Tab Switching Preserves State
expected: Enter Sanskrit text, run analysis, switch to Study tab, then switch back to Analyze. The input text and analysis results are still there (not cleared).
result: [pending]

### 5. Progress Checkmark Colors
expected: During analysis, the progress step checkmarks use the app's warm accent color (amber/brown tones) instead of bright green.
result: [pending]

### 6. Camera Capture Button
expected: In the image upload area, there are two buttons side by side: "Upload Image" and "Take Photo". Both are visible. On mobile, "Take Photo" opens the device camera directly.
result: [pending]

### 7. Camera Photo Feeds OCR Pipeline
expected: Taking a photo with the camera button (or selecting an image via it on desktop) processes the image through OCR the same way as a regular file upload — extracted text appears in the input area.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
