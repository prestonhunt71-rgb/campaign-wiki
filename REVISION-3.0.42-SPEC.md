# Revision 3.0.42 — District label alignment

- Use the same vintage mapping font and 14-unit font size on every district map.
- Keep each district name on one line and rotate it along the district's longest axis.
- Find the longest usable interior chord for each polygon so labels traverse the district with consistent end margins.
- Keep the thin dotted district boundaries and leave the citywide map unchanged.

Validation: all 96 non-browser regression tests and JavaScript syntax checks pass.
