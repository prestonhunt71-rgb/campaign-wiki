# Revision 3.0.28 — Delta City interactive map

Replaces the displayed body of the existing Article titled Delta City directly beneath Places with the supplied canonical PNG and 28 district overlays. The module does not write or migrate any Article records, IDs, relationships, visibility, or source links. Other article pages retain their existing rendering. Original Delta City text and image remain stored, while the map takes their place in this view.

Districts identify themselves on hover, keyboard focus, and touch. Mouse click or Enter/Space opens an exact, unambiguous visible Article title match. Touch identifies the district without navigating away. Unresolved district destinations remain identification-only. Explicit Article IDs can be supplied in scripts/delta-city-map.js via districtArticleIds; geometry lives in data/delta-city-districts.js.

Validation: 50 tests passed; JavaScript syntax passed; all geometry compared exactly to the supplied specification; PNG hash matches the supplied file and dimensions are 1100 x 1430. Live Forge, responsive interaction, and browser zoom verification remain pending because browser automation cannot start in this session.

Install this release as a Campaign Wiki module update; no uninstall or wiki database import is needed. Installation on the live Forge world remains pending.
