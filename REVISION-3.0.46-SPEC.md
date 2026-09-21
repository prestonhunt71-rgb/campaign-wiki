# Revision 3.0.46 — Consistent Home category inset

- Apply the same 10-pixel content inset beneath every top-level Home category heading.
- Cover Recently Added, Needs Actioning, GM-Only Articles, Article of the Day, and empty states.
- Apply the layout through shared selectors so categories receive the inset whenever they become visible.

Validation: all 98 non-browser regression tests and JavaScript syntax checks pass.
