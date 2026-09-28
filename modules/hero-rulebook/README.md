# HERO Rulebook 1.3.2 — Champions Fourth Edition

A standalone Foundry VTT 13 rulebook with Campaign Wiki-style navigation and editing. The supplied v7 JSON is preserved byte-for-byte, including all OCR corrections, 630 sections, and 169 retained table images. World customization is stored separately.

## Install or update

1. Close the Foundry world.
2. Extract the ZIP into your Foundry user-data `Data/modules` folder. The result must be `Data/modules/hero-rulebook/module.json`.
3. Restart Foundry and enable **HERO Rulebook** in Manage Modules.
4. Click **Rulebook**, or use its **Open Rulebook** setting.

The ZIP includes all assets. No PDF, Campaign Wiki dependency, or separate content download is required. Existing world organization, exclusions, custom articles, and House Rules are retained. This private package has no hosted manifest URL.

Parent-path dropdowns use a fixed readable control height so Foundry’s compact global styles cannot clip their selected labels.

## Navigation and editing

The sidebar starts with **Home**. The toolbar has search, **New Article**, and **Edit Article**. Selecting a parent displays its content, child tiles, and child articles beneath it. **Show section only** limits the view to one article.

Rulebook links are in-app navigation controls, so Foundry cannot treat them as external browser links. Sidebar entries, tiles, breadcrumbs, search results, and prose cross-references load content in the existing Rulebook pane.

All navigation, editing, relationship explanations, asset browsing, image enlargement, and deletion confirmation stay in the existing Rulebook window. Save and Cancel return to the article. The normal reader has no Earlier Reader button or pop-up editors.

The article editor contains:

- **Article Title** and **Article Text**, editable for both source and custom articles. Display edits are stored separately from the original v7 content.
- **Parent Article Paths**, using cascading choices like Campaign Wiki. Add multiple paths to place one article beneath several parents. The first parent path supplies the primary breadcrumb. Select Home alone to make an article top-level.
- **Article Images**, with any number of images. Add paths or HTTP(S) URLs, browse existing Foundry/Forge assets inline, add captions, remove images, and move them up or down. Existing retained tables are included in this list by default. Removing an image changes its display only; source images remain in the package.

**New Child Article** creates an article beneath the selected parent. **Explain Relationships** lists its parent paths and children. An article with several parents remains one stored article; editing it updates every placement.

## Manual order

**Order Home Articles** controls the top-level menu. **Order Children** controls the children of any article. Drag entries or use Move up/Move down, then Save. The order applies to the sidebar, tiles, and child text, and persists across reloads. Different parents can have different child orders. There is no automatic alphabetical sorting. Unordered source articles start in the supplied book order; new articles follow existing ones until reordered.

## House Rules, sharing, and removal

- **House Rules** stores separate notes displayed with the section, including to players.
- **Show to Players** opens the selected section for connected players. Only authenticated GM events can trigger sharing.
- **Player Preview** hides editing controls and displays the reader view inside the same window.
- **Delete** excludes the selected section from navigation, search, cross-links, and reading. Its children remain available beneath the nearest included ancestor. Restore it using **Home → Excluded Sections**.

All existing source sections remain included until the GM chooses to exclude them. Players cannot edit organization, images, articles, or House Rules. Customization is stored in the shared world setting `hero-rulebook.organizationV7`. Existing version 1.2 single-parent settings are supported without resetting saved content.

## Links and source integrity

Search covers headings, prose, and ancestry. Automatic links resolve duplicate titles contextually; unresolved duplicates open an in-pane chooser. All section URLs remain stable after title edits, moves, or reordering. Copy Link, browser Back/Forward, and refresh use `#hero-rulebook/rules/...` routes and require access to the same Foundry world.

The source contains two separate ENTANGLE articles (pages 67 and 68). Both are retained. The original v6 fallback was not present in the inspected project or Downloads folder and has not been overwritten or reconstructed.

Source SHA-256: `ca888fb273e9acd736b94af63157828ff598ebf632c2869b906bd9ec463decc0`.

The earlier page-based reader and its saved settings remain available through the legacy API for old references. The normal Rulebook UI uses the new in-window interface.

```js
game.modules.get('hero-rulebook').api.open();
game.modules.get('hero-rulebook').api.open({route: '/rules/powers/entangle'});
```

## Validation

145 repository tests pass. Browser checks cover all 630 rendered sections, all 169 decoded table images, launcher icon alignment, multiple parent placements, image addition/removal/reordering, inline asset browsing and enlargement, manual order and persistence, House Rules, authenticated sharing, deletion/restoration, narrow screens, and absence of extra windows. Foundry integration uses a mocked Foundry lifecycle; a live Foundry world was not available for verification.

From the repository root:

```text
node scripts/build-hierarchy.mjs <optional-original-v7-file>
node --test test/*.test.mjs
```

The workspace browser test is `work/hierarchy-navigation-browser-test.cjs`; reports and screenshots are in `outputs/hero-rulebook-v1.3.2`. For a read-only browser preview, serve the module folder over HTTP and open `reader.html`.
