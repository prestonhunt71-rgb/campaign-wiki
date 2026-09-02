# Revision 3.0.21 — Unified Article Text Linking

- Connect automatic linking directly to the body renderer used by unified Campaign Wiki Articles.
- Link only Articles related within the current top-level tree's configured relationship display depth.
- Link the first mention of each related Article, whether the text uses its title or one of its aliases/alter egos.
- Leave ambiguous terms unlinked rather than selecting an arbitrary Article.
- Exclude hidden targets before processing player-visible text, leaving their names as ordinary text with no unavailable-page link or visibility leak.
- Preserve HTML escaping and punctuation-aware whole-name matching.
