# Campaign Wiki 1.32.0

## Taxonomy-only Actor navigation

- Foundry Actor folders no longer control the Campaign Wiki sidebar or trigger
  a rebuild when moved.
- A one-time migration preserves current effective Actor placement as explicit
  taxonomy assignments before folder-derived navigation is removed.
- The complete existing Actor taxonomy tree, including intermediate and empty
  nodes, is copied with stable IDs and parentage.
- Unclassified Actors appear directly beneath Actors.
- Cross-branch classifications remain additive. A same-branch explicit
  classification prevents the former physical-folder classification from being
  added during migration.

## Team hierarchy

- Heroes/Teams and Villains/Teams wrappers are removed.
- Every child team is promoted directly beneath Heroes or Villains without
  changing its taxonomy ID, category page, or Actor assignments.
- Promoted team nodes receive a persistent team role so Known Associations does
  not depend on a taxonomy named Teams.
- New taxonomy classifications may be created with a Team purpose.

## Sections and navigation

- Adds the top-level Bases section.
- Removes the unused Events and MacGuffins sections and their specialized
  feature predicates.
- Every category displays a recursive count of unique visible articles.
  Multi-classified articles count once at each common ancestor, and player
  counts include only Public articles.

## Maintenance

- Restoring an older overlay reruns taxonomy, duplicate, and relationship
  migrations in a safe order.
- Removed stale Actor-folder rebuild hooks, obsolete Golden Agents redirect
  rendering, retired relationship choices, and superseded documentation.
- Audited all top-level functions, constants, imports, stylesheet selectors,
  and packaged files for a current purpose.
