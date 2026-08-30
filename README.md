# Campaign Wiki

Campaign Wiki is a Foundry VTT v13 module that organizes a campaign record around what happened at the table. The normal GM workflow is to create a Session, select or create its Arc, add featured campaign content through family-specific selectors, and write a synopsis. The Wiki derives appearances, Arc/Metaplot collections, geography, affiliations, and Automatic publication.

## Highlights

- Seven canonical types: Actor, Scene, Image, Area, Affiliation, Arc, and Session.
- Home-first application with persistent **+ New Arc** and **+ New Session** controls for GMs.
- Contextual creation; there is no global generic article button.
- Foundry-backed Actors and Scenes are imported only when selected. Typing a new name creates a minimal Foundry document and linked Wiki stub.
- Wiki-owned descriptions and metadata; live synchronization of Foundry name and artwork.
- Stable Wiki IDs and rename-preserved aliases.
- Exact, first-occurrence synopsis links with explicit collision remediation.
- Derived Arc/Metaplot, Affiliation, and geographic collections.
- Automatic, Always Public, and Always GM Only visibility with reference-safe player projection.
- GM-only Needs Attention workflow and historical previous-appearance suggestions.
- Previewed legacy migration with automatic backup and remediation for uncertain mappings.
- World-isolated JSON package export/import with automatic pre-import backup.

## Installation

In Foundry's **Add-on Modules** tab, use this manifest URL:

```text
https://github.com/prestonhunt71-rgb/campaign-wiki/releases/latest/download/module.json
```

Enable Campaign Wiki in a world, then open it using the book icon in the sidebar or **Configure Settings → Module Settings → Campaign Wiki**. Campaign Wiki always begins on Home, including a reopened pop-out.

## Data safety

Campaign Wiki stores one dataset in the current Foundry world's settings. Deleting a Wiki Actor or Scene never deletes its Foundry document. Broken Foundry links retain Wiki history. Deleting an Arc deletes its Sessions but not associated campaign articles. Deleting a Metaplot preserves its child Arcs and Sessions.

Version 2 detects the legacy Campaign Wiki overlay before making changes. A migration requires GM confirmation, creates a download backup first, migrates definitive mappings, and records uncertain items for remediation.

## Development

The Foundry integration is in `scripts/campaign-wiki.js`. Pure data and derivation logic is in `scripts/core.js`, allowing it to be tested outside Foundry.

```sh
npm test
```

The test suite covers stable Session-derived collections, geography, affiliations, Arc/Metaplot inheritance, derived dates, publication overrides, Metaplot secrecy, exact synopsis linking, ambiguity handling, visibility-safe player rendering, historical enrichment, alias-search boundaries, deletion, and integrity validation.

## Release

The module uses semantic versions. Version 2.0.0 is the schema-breaking Campaign Wiki redesign. Installable releases include both `module.json` and `campaign-wiki-vX.Y.Z.zip` assets.
