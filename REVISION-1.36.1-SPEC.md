# Campaign Wiki 1.36.1 Hotfix

- Fixes an information disclosure in player-projected wiki data.
- Relationships whose target article is not Public are now removed before Player Preview, player rendering, generated navigation facets, or player-facing export rendering.
- Private target names therefore cannot appear as unlinked placeholder tiles or as a generic `Linked Articles` group.
- Map pins targeting non-Public articles are also removed at the same projection boundary.
- GM views retain all relationships and map pins.
