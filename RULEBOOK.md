# Rulebook reader

Open Campaign Wiki > Rulebook. As GM, use Import batch for a prepared `hero-rulebook-batch-v1` JSON file, or Add page for manual entry. Manual `## Heading` lines create sections. Printed page labels stay separate from page IDs.

The reader supports search, contents, glossary, favorites, section images and searchable image transcripts, GM Show players, optional section house rules, review status, and collections saved as wiki articles. Edit section can link a passage to an earlier section for cross-page reading. Existing wiki article linking also applies to rule text.

## Remove irrelevant pages

As GM, choose Manage pages, uncheck unwanted pages, and Save. Removed pages are excluded from rulebook search, contents, glossary and favorites. Collected references display an unavailable-source notice. Recheck a page to restore it. This selection applies to everyone in the world and survives batch imports for the same book ID.

Removal does not delete Forge files or renumber pages. Notes and source content are retained. Page selections are stored in world settings and are not currently included in Export notes. Existing wiki collection articles remain separate articles; delete those in the wiki if no longer wanted.

## Private content and loading

The repository and module bundle contain no rulebook PDF or ingested book data. Import privately supplied content separately. Pages load on demand, images load lazily, and the search index loads when search is first used. OCR requires proofreading, especially numeric tables and fractions.

## Bundle

Run `python scripts/bundle-rulebook.py` from the repository root. This creates `campaign-wiki-rulebook.zip` with the reader preview version `3.0.52-rulebook.3`. Preview manifests omit release download URLs. ZIP files are ignored by Git; distribution content must be supplied separately.

