# Campaign Wiki 1.38.1

- Replaces the unreliable created/updated timestamp fallback with a persistent world-level first-seen registry.
- On first launch, silently registers every current article as the baseline so the Recently Added list starts empty.
- Records only articles discovered after that baseline, including New Page articles and newly created Foundry Actors or Scenes.
- Keeps first-seen times unchanged by edits, rebuilds, migrations, taxonomy changes, and folder moves.
- Presents Recently Added as a GM-only sidebar branch with the same + / - behavior as other branches.
- Starts the branch collapsed and shows up to ten genuinely new articles.