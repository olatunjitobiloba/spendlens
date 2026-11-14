# Scrum charter: SpendLens

## Product Goal
People who get bank statements can import transactions, protect essentials,
and test savings cuts with numbers calculated by code, not guessed by AI.
(Bank-as-buyer is a hypothesis. No bank has confirmed demand.)

## Roles for Sprint 1 (rotate each Sprint)
- Product Owner: Gift Oni (orders the backlog, speaks for users)
- Scrum Master: Oluwatobiloba Olatunji (keeps events short, board current)
- Developers: everyone, including the PO and SM
  Caleb Babatunde (ML), Fisayo Obadina (frontend), Olamilekan Owolabi (backend)

## Rhythm
- Sprint: 1 week (ends hackathon submission day: Nov 20, 2026)
- Daily Scrum: 10 min, Mon / Wed / Fri 09:00 UTC, in the Telegram group
- Sprint Planning: 30 min, start of Sprint
- Sprint Review: demo the live link, end of Sprint
- Retrospective: 15 min, 3 bullets: keep, stop, try

## Sprint Goal (Sprint 1)
A visitor can open the live link and complete a synthetic-data flow end to end.

## Definition of Done
- [ ] Built on a branch, merged through a pull request
- [ ] At least one teammate reviewed and approved
- [ ] Tests pass (`pytest -q`, plus the web build)
- [ ] Meets the card's acceptance check
- [ ] No secrets, real data or real account numbers committed
- [ ] README or card notes say how to run or test it
- [ ] If it's user-facing, it works on the live link in a private window
