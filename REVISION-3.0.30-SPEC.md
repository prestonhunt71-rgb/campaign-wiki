# Revision 3.0.30 — District article location maps

Adds a Location panel to the 28 mapped district Articles directly beneath Places → Delta City. Existing text, artwork, status, relationships, and visibility are preserved. Rendering performs no database writes or migrations.

Each panel reuses the original PNG and shared district polygon data. Crop bounds are calculated from the polygon with 6% padding, clamped to 12–35 map pixels and the image edges. SVG viewports retain each crop's natural aspect ratio. The selected district uses the stronger blue highlight requested for the city map.

Stable district Article IDs are recorded in data/delta-city-article-ids.js, verified against the campaign's local September 2 export, including The Industrial Belt and St. Theresa’s Mission Hospital. The mapping requires the existing Delta City parent ID and does not use fuzzy title matching. If an Article has been deleted and recreated since that export, its mapping will need its new ID.

Implementation: scripts/district-location-map.js contains crop calculation and panel rendering; scripts/campaign-wiki.js inserts the panel into the existing artwork column; styles/campaign-wiki.css supplies responsive panel styling. The PNG and district coordinates are unchanged.

Validation: 54 tests pass, including every district's vertex containment, adaptive padding, edge clipping, stable-ID matching, and Article data preservation. JavaScript syntax and diff checks pass. Live Forge visual checks at different viewport widths and browser zoom levels remain pending because browser automation is unavailable in this session.

Update the existing Campaign Wiki module to 3.0.30 and reload the world. No uninstall or wiki database import is needed.
