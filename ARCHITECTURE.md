# Architecture

## Runtime

`scripts/core.js` is a pure ES module. It owns schema normalization, stable identities, deletion semantics, four collection mechanisms, publication paths, exact synopsis linking, Needs Attention derivation, historical suggestions, search, and integrity validation.

`scripts/campaign-wiki.js` adapts that core to Foundry v13. It owns world settings, Foundry Actor/Scene synchronization, dialogs, the Home-first Application, navigation, visibility-safe rendering, legacy migration, and package import/export.

`styles/campaign-wiki.css` is the responsive Foundry presentation layer.

## Storage

Each world stores one `databaseV2` object. Entities are keyed by immutable Wiki ID. Foundry UUIDs are external source references, never Wiki identity. Names and aliases are searchable presentation metadata.

The surviving entity types are Actor, Scene, Image, Area, Affiliation, Arc, and Session. A Metaplot is an Arc with `arcType: "metaplot"`.

## Derived state

Only Session membership, Arc inheritance, Affiliation membership, and geographic containment form collections. Session Areas come from featured Scenes and their Area ancestors. Session Affiliations come from featured articles. Arc and Metaplot collections are unions of their Sessions. Dates, appearances, and Automatic visibility are computed rather than persisted as destructive flags.

Player rendering filters both targets and references. A hidden linked synopsis target becomes its original plain text. Hidden relationships and Metaplot structure are omitted. An unavailable direct target always renders the same generic message.

## Foundry synchronization

Actor and Scene documents are imported on demand. Their current names and artwork synchronize into Wiki records; a changed name preserves the previous Wiki name as an alias. Narrative fields import only at creation. Deleted sources mark the Wiki record missing without removing it or its history. Wiki deletion never deletes a Foundry document.

## Migration and portability

Legacy overlay detection runs only for an empty v2 database. Migration requires confirmation and downloads a backup first. Definitive records are mapped; uncertain manual/place/taxonomy content is retained as migration remediation rather than silently guessed.

Export packages contain the complete world dataset in a versioned envelope. Import validates the incoming graph, automatically exports the current dataset, and then replaces it.
