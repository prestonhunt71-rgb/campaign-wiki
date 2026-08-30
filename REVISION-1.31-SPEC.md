# Campaign Wiki 1.31.0

This revision makes taxonomy the primary model for broad group membership and
keeps manual relationships for facts that taxonomy cannot express cleanly.

## Relationship model

- Retains Link To/Linked From, Hunting/Hunted By, DNPC/DNPC Of,
  Leader Of/Led By, Partner Of, Rival Of, Owns/Owned By, Arc/Session feature
  pairs, and generated Scene appearances.
- Retires Enemy Of, Located At/Location Of, Associate Of, Member Of/Has Member,
  Teammate Of, and Employs/Employed By.
- Converts resolvable existing membership and employment relationships into
  Team and By Employer taxonomy assignments before deleting the obsolete
  relationship records from both articles.
- Removes Relationship Review and its unused interface, rollback data, styles,
  and documentation.
- Reapplies the automatic cleanup after restoring an older overlay backup.

## Included refinements

- Known Associations combines effective Team and By Employer classifications.
- Delta City 1937 is promoted directly beneath Home in live and standalone
  navigation.
