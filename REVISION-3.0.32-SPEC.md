# Revision 3.0.32 — Place coordinates, district pins, and map thumbnails

Place/Scene Articles with a direct Delta City district parent now have a Map Location section in the editor. Choose Set Location, click or tap the district crop, confirm Save Location, then save the Article. Change Location and Clear Location edit only the draft until the Article is saved. Keyboard users can focus the picker and use arrow keys (Shift for larger steps).

Coordinates are stored on the child as optional mapLocation: {x, y, parentId}, in the canonical 1100 × 1430 map coordinate system. parentId identifies which existing direct parent owns the marker when an Article has several parents; it does not create a relationship. Removing or changing the selected district clears the point and displays a warning. Adding unrelated parents retains the existing owner. Values must be finite, inside the canonical image and inside the selected district crop. Polygon containment is not enforced, so users may deliberately select nearby map details within that crop.

District maps show small pins only for visible direct Place children whose location belongs to that district. Pins identify the child on hover/focus and open it on click, tap, Enter or Space. Hidden Articles are filtered before rendering. Main Delta City maps never receive place pins. District crops remain unshaded, honoring the later user instruction over the supplied document's highlight suggestion.

Shared preview cards, relationship tiles (including Located in), home cards and attention lists now use the full canonical map for Delta City and automatic cropped map thumbnails for mapped districts. Existing cards retain their sizes; other Article thumbnails retain their previous behavior. No manually cropped images or duplicate geometry were added.

The schema stays at version 3. mapLocation is optional; no data migration, Article recreation, relationship rewrite, or wiki import is required. Existing prose and artwork remain in place.

Implementation: shared crop helpers in scripts/district-map-geometry.js; validation and ownership in scripts/map-location.js; draft picker in scripts/map-location-editor.js; pins and thumbnails in scripts/district-location-map.js; integration in scripts/campaign-wiki.js and scripts/unified-core.js; sizing in styles/campaign-wiki.css.

Validation: 60 automated tests pass. Local headless Chrome checks passed at widths 1100/768/390 and rendering scales 100%/125%/175%, covering canonical click conversion, keyboard and touch pin navigation, draft confirmation/cancel/clear, direct-parent changes, new Scene parent selection, player visibility, existing prose, and actual Article/card rendering. A rendered district map screenshot was inspected for pin and thumbnail sizing. Live Forge installation remains for the user to apply.

Update Campaign Wiki to 3.0.32 and reload the world; no uninstall or wiki database import is needed.
