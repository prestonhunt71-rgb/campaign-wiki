# Campaign Wiki 1.33.0

## Sidebar ordering

- Adds Tools / Sidebar Order for arranging the immediate subcategories of any
  chosen parent with Up and Down controls.
- Stores order per parent using stable category IDs in the module overlay.
- Reset restores alphabetical ordering for that parent.
- Category ordering applies to live Foundry, Player Preview, pop-out, and static
  HTML views. Article lists remain independently alphabetized.

## Counts

- Named Arc branches display the number of Session articles nested beneath
  them, excluding the Arc article itself.
- Category counts remain recursive, unique, and visibility-aware.

## Universal taxonomy editing

- Every explicit taxonomy assignment is visible as a removable chip on every
  editable article type, even when it also supplies the primary category or
  breadcrumb.
- Actor articles no longer show the obsolete Foundry-folder Category control or
  folder-placement guidance.
- Scene articles retain their read-only Foundry Scene-folder category guidance.
- Intermediate classifications are valid assignments and remain visible and
  removable rather than being restricted to leaf classifications.
- The fixed Public Home article remains non-editable.

## Validation

- Tested saved category ordering and reset-compatible alphabetical fallback.
- Tested Arc Session counts and recursive category counts.
- Tested taxonomy-chip visibility on Actor, Scene, and manual articles.
- Repeated JavaScript, manifest, migration, dead-code, stylesheet, and package
  content audits before release.
