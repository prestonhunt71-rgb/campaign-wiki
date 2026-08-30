# Campaign Wiki 1.39.0

- Adds an Arc Status field to parent Arc articles: In Progress or Completed.
- Makes Arc status authoritative for visibility.
- In Progress makes the Arc, its Sessions, and every article directly related to the Arc or one of its Sessions GM-only.
- Completed makes that same direct content set Public.
- Uses one relationship hop so unrelated connections belonging to a linked Actor, Scene, or other article are not swept into the Arc.
- When content is linked to more than one Arc, In Progress takes precedence over Completed.
- Disables manual visibility editing while an article is controlled by one or more Arc statuses and identifies the controlling Arc in the editor.
- Shows Arc status beside the visibility badge on Arc and Session articles.
- Seeds all existing parent Arcs as Completed except The Crow of Ypres, which is seeded In Progress.
- Defaults newly created parent Arcs to In Progress.
