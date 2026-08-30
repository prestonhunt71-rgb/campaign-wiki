# Campaign Wiki 1.28

This release reduces ongoing classification work while preserving the generated
Foundry index and the separate manual overlay.

- Foundry folder placement remains automatic and survives rebuilds and moves.
- Additional taxonomy assignments use persistent add/remove chips.
- DNPCs and Named NPCs remain visible source classifications.
- Redundant Good Guys, Golden Agents, NPCs, Bad Guys, and villain-team source
  branches are flattened from navigation.
- The obsolete Labels tree and its taxonomy assignments are removed without
  deleting article records.
- Known Associations is derived from Actor taxonomy.
- Tools remembers its expanded state during rerenders.
- Related Handouts appear as responsive linked thumbnails on Actor and Scene
  articles, including the standalone HTML export.

Cache schema: 18. Overlay navigation/taxonomy migration: V4.

Version 1.28.1 adds a one-time V5 migration that merges the obsolete duplicate
Golden Agents taxonomy into the copy beneath Heroes / Teams, redirects existing
article assignments and category-page references, and prevents creation of new
custom classifications with duplicate names.

Version 1.28.2 is the QA bugfix build. It removes the obsolete direct Golden
Agents branch while preserving Heroes / Teams / The Golden Agents, treats broad
Actor roots as fallback placements when a more specific taxonomy is assigned,
and corrects the taxonomy autocomplete placeholder encoding. Featured As Actor
In is now a collapsed five-item list with Show All behavior. Known Associations
is derived only from Teams and Actors / By Employer classifications; all explicit
taxonomy assignments appear separately in a collapsed Taxonomy section.

Version 1.29.0 restores category-scoped individual relationship selection by
rebuilding the target autocomplete from the selected category's members. It
also adds looping Previous / Next navigation for every sidebar folder of
articles. The navigation follows the exact folder used to open an article,
works in both reading and editing views, preserves the edit workflow after Save,
and warns before discarding unsaved changes.
