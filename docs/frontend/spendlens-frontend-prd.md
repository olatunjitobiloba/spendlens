# Product Requirements: Frontend Engineer

**Owner:** Fisayo Obadina | **Project:** SpendLens | **Status:** Draft | **Date:** 29 Oct 2026

## 1. Context

SpendLens is an API-first spending review product. Users import transaction records, review their spending, protect essential expenses, and test savings scenarios. Code does every calculation. AI only explains validated results. A demo app plays the role of a bank or fintech app embedding the API. Kora Checkout handles payment for paid features.

**Team:** Olatunji Oluwatobiloba (Team Lead, AI Engineer), Caleb Babatunde (ML Engineer), Fisayo Obadina (Frontend Engineer), Olamilekan Owolabi (Backend Engineer), Gift Oni (Business Analyst and presenter).

**Free versus Pro (hypothesis, untested):** Free gives one summary and a view-only scenario. Pro (30 days, test price set by an environment variable) adds saved scenarios, month comparison, goal progress, and later forecast and chat.

**Timeline:** v1 Oct 30 to Nov 6 (checkpoint Nov 7). v2 Nov 7 to Nov 13 (checkpoint Nov 14, lifeline). v3 Nov 14 to Nov 19 (checkpoint Nov 20). Feature freeze Nov 18. Rehearsal and backup video Nov 18 and 19.

**Rules for everyone:** synthetic data only. No banking passwords, no money movement, no automatic cancellations. AI never produces a number. Forecasts are ranges and the system abstains when data is thin. No invented users, revenue, partnerships, accuracy or compliance claims. Do not copy another company's brand or UI.

## 2. Your goal

Build a demo app that shows how a bank or fintech app would embed SpendLens, and lets a judge complete the whole workflow in a few minutes: import, review, protect essentials, test a savings cut, pay to unlock Pro.

**Team decision to confirm:** use a neutral fictional host app ("Partner Bank") instead of copying another company's UI and logo. Copying a real brand risks trademark and impersonation problems, and judges may read it as imitation. The point is to show the embed, and a neutral shell shows it just as well. Change this only if the team decides otherwise on purpose.

## 3. Users

**Primary demo users:** judges and early testers (students and young adults) using synthetic data.
**Secondary:** a bank or fintech product person watching how the module would sit in their app.

## 4. Scope by version

| Version | Screens and behavior |
|---|---|
| v1 (Oct 30 to Nov 6) | Partner shell with a "Money Insights" entry. Sample-data mode. CSV import wizard (choose file, preview, errors, confirm). Review screen with coverage summary, reconciliation candidates, category correction. Protect essentials. Scenario builder with calculation and supporting transactions. Plain-language explanation panel. Free versus Pro gate and Kora checkout. Delete my data. |
| v2 (Nov 7 to Nov 13) | Forecast view (range per category, with method and "not enough data" state). Recurring candidates list. Month-over-month comparison and goal progress (Pro). |
| v3 (Nov 14 to Nov 19) | Chat panel with streaming replies and evidence links. Voice input button (stretch, only if text chat is stable). |

## 5. Requirements

- **R1.** The UI never calculates savings or totals. It displays numbers returned by the API.
- **R2.** Every finding links to the transactions behind it.
- **R3.** Uncertainty is stated in words ("Possible duplicate", "Not enough data"), not only color.
- **R4.** A first-time visitor can try the sample data without signing up.
- **R5.** Pro unlocks only after the backend reports the order as paid. A browser success callback is not proof of payment.
- **R6.** Every error has a clear message and a next step (bad CSV row, API asleep, payment failed).
- **R7.** Works on a phone-sized screen and with keyboard only.
- **R8.** Follow the Impeccable design guidance (github.com/pbakaus/impeccable) and avoid template-looking dashboards.

## 6. Acceptance criteria

- A new person completes import to scenario on sample data in under 3 minutes without help (test with someone outside the team).
- All numbers on screen match the API response exactly.
- Payment success, failure, cancel and pending states are all visible and tested.
- No keyboard traps. Visible focus. Labeled form fields. Contrast passes WCAG AA.
- Fixture mode lets the demo run if the backend is down.

## 7. Deliverables and dates

| Date | Deliverable |
|---|---|
| Oct 30 | Neutral shell, design tokens, fixture mode |
| Nov 1 | Import wizard on fixtures |
| Nov 3 | Review, reconciliation, category correction |
| Nov 4 | Protections and scenario builder |
| Nov 5 | Free versus Pro gate and Kora checkout (sandbox) |
| Nov 6 | Integration with live API, accessibility pass |
| Nov 12 | Forecast, recurring, comparison, goal progress |
| Nov 17 | Chat panel, voice if stable |
| Nov 18 | Feature freeze |

## 8. Dependencies

- API contract and OpenAPI file from Olamilekan by Oct 31.
- Fixture JSON for every endpoint (agree on it Oct 30).
- Kora sandbox public key from Olamilekan.

## 9. Out of scope

A native mobile app. A browser extension. Fake testimonials, fake trust badges, or any claim about users we do not have. Copying a real company's brand.

## 10. Risks

- Building screens before the API shape is settled. Use fixtures and agree on the contract first.
- Too many dashboard widgets. Show the one decision: what can I cut?
- Voice input depends on browser support. Treat it as optional.
