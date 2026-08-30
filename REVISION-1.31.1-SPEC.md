# Campaign Wiki 1.31.1

This bugfix prevents a source Actor folder and an explicit taxonomy tag from
creating duplicate sidebar placements when both belong to the same major Actor
branch.

For example, an Actor physically stored under Creatures / Monsters and tagged
Creatures / Spirits now appears only under Spirits. Classifications from other
branches remain additive, so combinations such as Normals / DNPCs and By
Profession / Scientist continue to appear in both appropriate locations.
