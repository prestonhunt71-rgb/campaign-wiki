# Revision 3.0.6 — Top-Down Inheritance and Player Preview

- Group all Featured People sections together and all Featured Image sections together.
- Keep standard relationship categories in stable order and custom categories alphabetical.
- Remove the bottom Edit Article button while retaining the top toolbar editor.
- Restrict Arcs navigation to Arcs and their Sessions only.
- Keep attached People, Places, and Images on Article pages rather than in Arc navigation.
- Add a bottom Player Preview button with player-filtered Article, relationship, Home, search, and sidebar rendering.
- Add an obvious Exit Player Preview control.
- Add GM-editable Home and Player Unavailable special pages with title, image, and body text.
- Derive relationship inheritance top-down across all Articles without storing duplicate edges.
- Prevent child relationships from propagating upward.
- Derive visibility top-down from the nearest explicit ancestor rule.
- Let an Article's explicit visibility override inheritance and resolve equal-depth conflicts as GM Only.
- Extend automated coverage for top-down visibility and multi-parent conflict behavior.
