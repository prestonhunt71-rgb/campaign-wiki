# Revision 3.0.43 — Missing Foundry source resolution

- Require an explicit action for each missing Foundry source in the recovery dialog.
- Add Leave unresolved (hide warning), which retains the source record and removes the Article from Needs Actioning.
- Add Remove Foundry source link, which permanently detaches the deleted Actor or Scene while preserving the Wiki Article.
- Preserve replacement-document relinking and unlinked-document recreation.
- Hide saved unresolved warnings from both Needs Actioning and subsequent recovery lists.

Validation: all 97 non-browser regression tests and JavaScript syntax checks pass.
