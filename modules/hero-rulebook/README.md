# HERO Rulebook 1.1.0 — Champions Fourth Edition

This standalone Foundry VTT 13 module reads `data/hero-rulebook-rules.organized-v7.json` directly. The supplied v7 file, including all OCR corrections and embedded image data, is included byte for byte. No old page-based prose or saved text overrides are mixed into this view.

## Install

1. Close the Foundry world.
2. Extract the release ZIP into your Foundry user-data `Data/modules` folder. The result must be `Data/modules/hero-rulebook/module.json` (not an extra nested folder).
3. Restart Foundry, open the world, and enable **HERO Rulebook** in Manage Modules.
4. Click **Rulebook**, or use the module's **Open Rulebook** setting.

This is a complete local ZIP, including all 169 table images. No PDF, separate content download, or Campaign Wiki dependency is needed for the v7 reader. This private package has no hosted manifest URL.

## Use

- Expand the contents tree and click any heading. All 630 sections retain their source order and ancestry.
- Search headings, rules prose, or ancestry; heading matches rank first. Ctrl/Cmd+K focuses search while the reader is focused.
- Click underlined rule names to navigate. Dotted-underlined terms open a chooser when repeated headings cannot be resolved uniquely from context.
- Switch to **Read-through mode** to read the selected section and all descendants in order.
- Click a table to enlarge it. Missing assets display an explicit placeholder.
- Use **Copy section link**, browser Back/Forward, or the previous/next article links. Links use `#hero-rulebook/rules/...` so Foundry hosting needs no server route changes. Deep links require access to the same Foundry world. Opening them in a new tab or refreshing opens the reader after Foundry is ready.
- **Referenced by** lists actual resolved incoming links. Hover a rules link for its breadcrumb, printed source, and a short preview.

For a browser-only reader, serve the module folder over HTTP and open `reader.html`. Its links work the same way. Opening ES modules directly with `file://` is not supported by browsers.

## Existing work

**Earlier reader** opens the existing page-based reader for older collections, notes, and import workflows. Its content-folder setting applies only to that earlier reader. Existing saved data and previous source packages remain untouched. Old page-reference API calls continue to use that reader; new calls use the v7 view:

```js
game.modules.get('hero-rulebook').api.open();
game.modules.get('hero-rulebook').api.open({route: '/rules/powers/entangle'});
game.modules.get('hero-rulebook').api.openLegacy();
```

The specification names `hero-rulebook-rules.hierarchical-v6.json` as a fallback. That file was not present in the inspected project or Downloads folder; it has not been overwritten, reconstructed, or substituted for v7.

## Source details and validation

The hierarchy and wording are preserved as supplied, including two separate ENTANGLE articles: page 67 under Powers > Enhanced Senses, and page 68 under Powers. Ambiguous mentions offer both articles with source references. The reader does not merge or reinterpret them.

The v7 source contains 630 logical sections, 24 top-level divisions, 63 repeated normalized heading names, and 169 retained tables. Every section has a deterministic ancestry route; collisions use source-page suffixes, with stable occurrence suffixes only when source pages also coincide. All images are extracted from the v7 file itself.

Source SHA-256: `ca888fb273e9acd736b94af63157828ff598ebf632c2869b906bd9ec463decc0`.

Automated validation covers exact rendered prose for all 630 sections, all 169 decoded images, hierarchy order, whole-term longest-first linking, ambiguity, protected content, search, table-only sections, deep-link refresh, copied links, Back/Forward, responsive contents, and visible missing-image errors. Foundry integration is checked using a mocked Foundry application lifecycle; a live Foundry world was not available for verification.

From the repository root:

```text
node scripts/build-hierarchy.mjs <optional-original-v7-file>
node --test test/hierarchy.test.mjs test/rulebook*.test.mjs
```

The workspace browser test is `work/hierarchy-browser-test.cjs`; reports and screenshots are under `outputs/hero-rulebook-v7`. The existing `scripts/bundle-rulebook.py` now includes images, the browser entry point, and documentation.
