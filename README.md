# FestOS · Ranbhoomi Control (Epinoia 2026, Aarohan)

## Run (no install)
1. Unzip, open the folder in VS Code.
2. Double-click `index.html` (or use the Live Server extension, or `python -m http.server 8000` then open http://localhost:8000).
3. Click any test login below and press Enter. Internet is only used for Google Fonts (falls back offline).

If you edit anything in `data/*.csv`, run `python build.py` to regenerate `data.js`.

## Test credentials
| user | password | access |
|---|---|---|
| director | director123 | everything, budget override, audit |
| accom | accom123 | stay, reconcile, participants, lab |
| events | events123 | battle board, lab (contact/medical masked) |
| logistics | logi123 | stores, lab |
| vendor | vendor123 | kitchen (sees diet only) |
| volunteer | vol123 | tower, board, stores (all PII masked) |

## Live-test cheatsheet (Disruption Lab)
Type a reason first, then: late contingent, hostel block closure, equipment failure, venue unavailable, vendor shutdown, duplicate merch claim. Duplicate record = Reconcile → Merge. Every change recomputes real state, shows the **Ripple** map, and writes to the Audit Trail. State persists in localStorage; "Reset demo state" clears it.

## What it decides (and how)
- **Accommodation**: hard needs first (wheelchair → accessible rooms; ground-floor needs → floor 0), gender only from declared Male/Female; blank/non-binary/undisclosed go to a human-confirmed queue, never guessed. Contingents fill consecutive rooms; overflow goes to external stays cheapest-first within budget; over-budget placements are held until the director overrides with a reason. Re-allocation is *sticky*: people keep their room unless it closed.
- **Schedule**: greedy scoring over venue × 30-min slots: participant clashes, volunteer cover by shift, capacity, venue-type fit, equipment with zero serviceable units, round ordering. Residual conflicts are listed, not hidden.
- **Stores**: usable = quantity − reserved; items issued once per person; "under repair/needs check" never counted as usable.
- **Kitchen**: expired or mid-fest hygiene certificates, hours, dietary coverage per need (nut-allergy and Jain are uncovered; blank diet = unverifiable).

## Assumptions & limits (say these in the pitch)
Leaders/escorts aren't in participants.csv so their beds aren't modelled · no washroom data → "near washroom" treated as ground floor · external stays have no accessibility data → flagged unverified · merch demand counts every active person · schedule is a heuristic, not a proven optimum · login is client-side demo auth (a real build needs a server) · external re-placements are not sticky.

## AI disclosure slide (draft)
AI (Claude) drafted the engine and UI code. The team decided the rules (hard vs relaxed constraints, no inference of blanks), the assumptions above, and the demo flow. Outputs were checked by running the engine on the pack (all 2,836 records, 79 round-slots scheduled, 694 beds short reproduced by hand: 2,144 requests vs 1,450 beds), plus headless-browser click-through of every page and disruption.
