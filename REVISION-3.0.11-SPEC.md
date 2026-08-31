# Revision 3.0.11 — Duplicate Artwork Audit

- Add a read-only Audit Duplicates operation to the Campaign Wiki Artwork Organizer.
- Hash accessible artwork with SHA-256 to identify exact duplicates even when filenames differ.
- Distinguish exact duplicates from same-name files containing different data.
- Prefer sidebar-derived destination files as canonical while reporting redundant-copy candidates.
- Export the complete duplicate audit as JSON and leave every Forge file untouched.
