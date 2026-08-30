# Architecture

## Runtime

`scripts/unified-core.js` is the schema-v3 pure ES module. It owns Article normalization, stable identities, multi-parent paths, cycle prevention, visibility, Needs Actioning, search, validation, derived dates, and conservative v2 migration. `scripts/core.js` remains solely as tested legacy-v2 support.

`scripts/campaign-wiki.js` adapts that core to Foundry v13. It owns world settings, Foundry Actor/Scene synchronization, dialogs, the Home-first Application, navigation, visibility-safe rendering, legacy migration, and package import/export.

`styles/campaign-wiki.css` is the responsive Foundry presentation layer.

## Storage

Each world stores one `databaseV3` object. Articles are keyed by immutable Wiki ID. Foundry UUIDs are external source references, never Wiki identity. Names and aliases are searchable presentation metadata.

Every record is an Article. The only fixed navigation nodes are Home, Metaplots, Arcs, Places, People, and Images. An Article has one or more immediate parents, forming an acyclic graph. Article meaning comes from its position rather than a persisted type.

## Derived state

Child lists, breadcrumb paths, inherited ancestry, and parent date ranges are derived from `parentIds`. Multi-parent Articles render in every valid path while retaining a single identity and body.

Player rendering filters both targets and references. A hidden linked synopsis target becomes its original plain text. Hidden relationships and Metaplot structure are omitted. An unavailable direct target always renders the same generic message.

## Foundry synchronization

Creating an Actor or Scene creates a title-only placeholder beneath People or Places. Their current names and artwork synchronize into Wiki records; a changed name preserves the previous Wiki name as an alias. Deleted sources mark the Wiki record missing without removing it or its history. Wiki deletion never deletes a Foundry document.

## Migration and portability

V2 migration runs only for an empty v3 database. Migration requires confirmation and downloads the untouched v2 database first. Exact type and relationship facts become Articles and parent links; the v2 setting and legacy overlay remain unchanged.

Export packages contain the complete world dataset in a versioned envelope. Import validates the incoming graph, automatically exports the current dataset, and then replaces it.
