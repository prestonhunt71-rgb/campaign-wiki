# Campaign Wiki

Campaign Wiki is a Foundry VTT v13 module built around one universal Article model. Articles are organized by parent relationships rather than exposed database types, and one Article may have several parents without being duplicated.

## Navigation and workflow

Home is followed by five fixed roots: Metaplots, Arcs, Places, People, and Images. Everything beneath them is an Article. Metaplots is hidden when empty, all branches begin collapsed on each open, and expansion state lasts for that open window.

- **New Article** uses one universal form with progressive parent-path selectors.
- Every Article requires at least one immediate parent and may have several.
- **New Child Article** creates a title-only placeholder beneath the current Article and adds it to **Needs Actioning**.
- New Foundry Actors and Scenes automatically create placeholders beneath People and Places respectively.
- Token art, source name, and source imagery synchronize without deleting Wiki text or relationships.
- Dates on descendants provide derived date ranges for their parents.
- Contextual relationships and visibility inherit from ancestors downward, never from descendants upward.
- Visibility supports Automatic, Always Public, and Always GM Only, with explicit Article settings overriding inheritance.
- Player Preview simulates player-safe Articles, relationships, navigation, Home, and search.
- GMs can customize the Home and hidden-Article unavailable pages from module settings.

## Installation

In Foundry's **Add-on Modules** tab, use this manifest URL:

```text
https://github.com/prestonhunt71-rgb/campaign-wiki/releases/latest/download/module.json
```

Enable Campaign Wiki in a world, then open it using the book icon in the sidebar or **Configure Settings → Module Settings → Campaign Wiki**.

## Data safety

Campaign Wiki stores one dataset in the current Foundry world's settings. Deleting a Wiki Article never deletes its Foundry Actor or Scene.

The v2-to-v3 migration is deliberately conservative. It requires GM confirmation, downloads the untouched v2 database first, retains the old world setting and legacy overlay, preserves existing text and images, and converts only exact structural relationships. The migration creates optional organizer Articles such as Heroes, Affiliations, Equipment, and Session Art; these are ordinary editable Articles, not hard-coded categories.

## Development

The Foundry integration is in `scripts/campaign-wiki.js`. The unified graph and migration logic is in `scripts/unified-core.js`, allowing it to be tested outside Foundry.

```sh
npm test
```

The test suite includes multi-parent paths, cycle prevention, placeholders, derived dates, conservative migration, and the complete v2 regression suite.

## Release

The module uses semantic versions. Version 3.0.0 introduces the unified, multi-parent Article schema. Installable releases include both `module.json` and `campaign-wiki-vX.Y.Z.zip` assets.
