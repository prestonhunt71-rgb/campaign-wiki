# Standalone HERO Rulebook

Install both `campaign-wiki-standalone.zip` (the wiki with reader integration removed) and `hero-rulebook-standalone.zip` (the new reader module). Enable HERO Rulebook in Manage Modules and reload as GM first. Rulebook has its own button immediately below Campaign Wiki. It works without Campaign Wiki enabled as well.

On first GM startup, HERO Rulebook copies the old content folder, edits, house rules, review records, glossary, removed-page choices and saved collections into its own settings. Each user's favorites copy on their next startup. Source settings and old wiki collection articles are retained as backups. Old wiki collection articles no longer render linked rulebook content and may be deleted manually after checking the migrated collections. Migrated collections are GM-only, avoiding accidental exposure of previously private wiki articles. Show players remains available for individual rules.

The rulebook no longer links to wiki articles or saves collections into the wiki. Use Saved collections within Rulebook. Import content into the separate reader; no PDF or ingested book content is distributed in either ZIP.

## Headings and cleanup

`## Heading` starts a section when adding a page. `### Subheading` and `#### Smaller subheading` render inside the current section and stay searchable. Edit section supports these subheading markers in Text. Existing OCR sections are not automatically merged.

Manage pages lets the GM uncheck irrelevant pages. They disappear from search, contents, glossary, favorites and collected source text. Recheck to restore. Numbering and source files are preserved. Removing pages does not reclaim Forge storage. Page choices are world settings, not part of Export notes.

## Build

Run `python scripts/bundle-rulebook.py` to build both code-only ZIPs. Rulebook source lives in `modules/hero-rulebook`; it has its own manifest, styles, scripts and persistence namespace. Campaign Wiki does not load those files. Run `node --test test/*.test.mjs` for the combined development test suite.
