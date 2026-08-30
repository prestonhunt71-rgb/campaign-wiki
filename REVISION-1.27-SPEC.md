# Campaign Wiki 1.27 — Frozen revision specification

Approved 2026-08-01.

## World isolation

- Campaign Wiki supports separate Foundry worlds, not multiple sites inside one
  active world.
- Settings, migrations, backups, exports, and any module-managed asset namespace
  are keyed by the stable Foundry world ID.
- Golden Age seed data must never run in an unrelated world.
- Foundry cannot browse an inactive world's settings, so no cross-world selector
  is included.

## Fixed navigation and taxonomy

- Characters: Heroes, Villains, Normals, Creatures.
- Actor migration: Player Characters and Good Guys to Heroes; Villains to
  Villains; Bad Guys, DNPCs, Named NPCs, NPCs, and uncategorized Actors to
  Normals; Monsters to Creatures.
- Scenes: Delta City, Generic, Elsewhere, Rural. Rural and Elsewhere map
  directly; known Delta City district folders map to Delta City; Reference Art
  remains excluded; unclear folders require review.
- Existing meaningful folders become hierarchical tags beneath the fixed
  classifications. Articles store explicit leaf tags and inherit ancestors.
- Dynamic tags sort by descending represented article count.
- Tags control sidebar placement only and remain separate from relationships.
- The Taxonomy Manager supports create, rename, re-parent, merge, and delete.

## Arcs and Sessions

- Remove generic Parent Article everywhere.
- Sessions use specialized `arcId` linkage.
- Arcs sort newest first. Sessions within an Arc sort oldest first.
- Current relationship snapshot inheritance remains editable per Session.

## Relationships

- Entry order: optional broad target filter, searchable target autocomplete,
  applicable predicate, Add.
- Migration is proposed in a temporary review screen before commit.
- Review supports status filters and changing target, predicate, and disposition.
- Preserve a rollback-safe copy until successful commit.
- Remove the review/compatibility layer only in the following release after the
  migration is confirmed.

## Editing and deletion

- Save keeps the editor open and preserves scroll/expanded state.
- Save & Close returns to the article.
- Cancel warns when dirty.
- Manual pages use confirmation-protected permanent deletion.
- Generated Actor/Scene articles use Reset Wiki Data and never alter Foundry
  source documents.

## Release process

- Preserve staged removal of the Additional Information heading, relationship
  group balancing, and the source cleanup.
- Audit sidebar controls and Article Explorer overlap.
- Perform a final dead-code and obsolete-data audit after implementation.
- Do not package until implementation and migration behavior are verified.
