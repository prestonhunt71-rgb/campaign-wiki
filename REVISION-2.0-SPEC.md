# Revision 2.0 — Session-first redesign

Revision 2.0 replaces the generated-cache/manual-overlay taxonomy architecture with a world-isolated entity database and derived campaign model.

Implemented product boundaries:

- Actor, Scene, Image, Area, Affiliation, Arc, and Session are the only first-class types.
- Sessions explicitly store featured content and belong to exactly one Arc.
- Arc/Metaplot contents, dates, publication, appearances, Session Areas, and Session Affiliations are derived.
- Foundry Actors and Scenes are represented on demand and retain history after a source disappears.
- Visibility-safe GM/player projections do not disclose inaccessible names or relationships.
- Alias, ambiguity-resolution, historical-enrichment dismissal, and migration-remediation state use stable IDs.
- Legacy taxonomy and generic relationship structures are not recreated.

The authoritative behavior and acceptance criteria are in `Campaign_Wiki_Redesign_Codex_Implementation_Spec.md` in the design handoff; this revision file records the shipped architecture boundary.
