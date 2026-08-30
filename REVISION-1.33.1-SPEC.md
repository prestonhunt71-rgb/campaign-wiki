# Campaign Wiki 1.33.1

- Adds a post-taxonomy-migration cleanup for duplicate sibling classifications.
- Merges siblings only when they share both the same normalized name and the
  same parent.
- Prefers the team-typed, populated, or non-generated taxonomy entry.
- Redirects Actor/article assignments, category pages, child classifications,
  primary category references, and saved sidebar ordering to the retained ID.
- Applies generically to all duplicate sibling classifications rather than
  hard-coding The Golden Agents.
- Reruns after restoring an older overlay backup.
