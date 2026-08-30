# Campaign Wiki 1.36.0 (staged, not bundled)

- Adds four generated navigation views beneath Handouts and Session Artwork:
  - By Arc / Session
  - By Location / Scene
  - By Team / Actor
  - All
- The first three views derive from `Link To` and inverse `Linked From` relationships; they do not create taxonomy or duplicate article records.
- All preserves the real taxonomy hierarchy and includes unlinked material.
- Arc/Session view nests Sessions beneath their parent Arc.
- Location/Scene view preserves the linked Scene's area hierarchy.
- Team/Actor view groups Actors beneath every explicitly assigned team taxonomy, with Other Actors as a fallback.
- Generated branches and sub-branches display unique article counts and begin collapsed.
- Player and Player Preview navigation is derived only from visible articles and visible relationship targets.
- Static HTML export uses the same generated navigation structure.
