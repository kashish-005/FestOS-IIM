# FestOS · Ranbhoomi Control
### Epinoia 2026 · Aarohan

FestOS is a festival operations command center designed to help organizers manage accommodation, event scheduling, inventory, vendors, disruptions, and audit trails from one place.

**Live Demo:** [https://festos-iim.vercel.app/](https://festos-iim.vercel.app/)

## Try the Demo

1. Open the [FestOS Live Demo](https://festos-iim.vercel.app/).
2. Select a test role or enter one of the credentials below.
3. Use the relevant dashboard to explore festival operations.
4. For disruption scenarios, open **Disruption Lab**, enter a reason, and trigger a scenario.

### Test Credentials

| User | Password | Access |
|---|---|---|
| `director` | `director123` | Full access, budget overrides, audit trail |
| `accom` | `accom123` | Accommodation, reconciliation, participants, disruption lab |
| `events` | `events123` | Battle Board and disruption lab; contact/medical data masked |
| `logistics` | `logi123` | Stores and disruption lab |
| `vendor` | `vendor123` | Kitchen dashboard; dietary information only |
| `volunteer` | `vol123` | Control Tower, Battle Board, Stores; personal data masked |

> These are demo credentials for evaluation, not production authentication.

## Key Modules

- **Control Tower** — central overview of festival status, operational alerts, and resource readiness.
- **Reconcile** — review participant records, contingent-strength differences, and possible duplicate records.
- **Participants** — unified participant information with role-based access to sensitive fields.
- **Stay** — accommodation allocation, capacity gaps, accessibility constraints, and external placements.
- **Battle Board** — event scheduling and visibility into participant, venue, equipment, and volunteer conflicts.
- **Stores** — inventory availability, reservations, condition tracking, and issuance.
- **Kitchen** — vendor hours, hygiene status, dietary coverage, and operational issues.
- **Disruption Lab** — simulate operational changes and inspect their downstream effects.
- **Audit Trail** — review recorded actions and changes.

## Disruption Lab Scenarios

Enter a reason before triggering a scenario:

- Late contingent
- Hostel block closure
- Equipment failure
- Venue unavailable
- Vendor shutdown
- Duplicate merchandise claim

For duplicate participant records, use **Reconcile → Merge**.

Disruptions recompute the operational state, display the **Ripple** map of downstream effects, and record changes in the Audit Trail.

Demo state is stored in the browser. Use **Reset demo state** to clear simulated changes.

## Decision Logic

### Accommodation
- Prioritizes hard accessibility needs.
- Wheelchair needs are matched to accessible rooms; ground-floor needs are matched to floor 0.
- Gender-based placement uses only explicitly declared Male/Female values.
- Blank, non-binary, and undisclosed gender values are sent to human review rather than inferred.
- Contingents are kept together where possible.
- External stays are considered cheapest-first within the available budget.
- Over-budget placements require a director override with a reason.
- Existing placements remain stable unless the assigned room becomes unavailable.

### Event Scheduling
- Uses a heuristic scoring process across venues and 30-minute time slots.
- Considers participant clashes, volunteer coverage, venue capacity and type, equipment availability, and round order.
- Remaining conflicts are surfaced rather than hidden.

### Stores
- Usable quantity is calculated as quantity minus reserved quantity.
- Items marked under repair or needing a check are not treated as usable.
- Merchandise issuance is tracked to avoid duplicate claims.

### Kitchen
- Checks vendor certificate status, operating hours, and dietary coverage.
- Expired or during-festival-expiring hygiene certificates are flagged.
- Nut-allergy and Jain coverage gaps are surfaced.
- Blank dietary information is treated as unverifiable, not as clearance.

## Data & Validation

FestOS uses the provided Aarohan problem statement and dataset, including participant, registration, contingent, event, venue, hostel, external-stay, inventory, merchandise, vendor, and core-team records.

Key dataset figures:
- 2,836 participant records
- 38 contingents
- 5,580 event registrations
- 2,144 accommodation requests
- 1,450 nominal accommodation beds
- 694-bed overall accommodation shortfall

The dataset contains missing fields, inconsistencies, and operational constraints. FestOS surfaces uncertainty for review instead of silently assuming missing information is valid.

## Assumptions & Limitations

- Contingent leaders and escorts are not included in `participants.csv`; their accommodation is not modelled.
- Washroom-location data is unavailable, so “near washroom” needs are approximated as ground-floor placement.
- External stays lack accessibility information; those placements are flagged as unverified.
- Merchandise demand is estimated using active participants.
- Event scheduling is heuristic and is not guaranteed to be globally optimal.
- External accommodation re-placements are not sticky.
- Authentication is client-side demo authentication; a production deployment would require server-side authentication and authorization.

## AI Tools Disclosure

AI (Claude) assisted with drafting the engine and UI code.

The team defined the operational rules, hard and relaxed constraints, assumptions, and demo workflow. The team reviewed outputs against the supplied dataset, manually checked key figures, and tested the interface and disruption scenarios.

AI-generated outputs were treated as suggestions and were checked before inclusion.
