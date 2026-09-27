# Champions 4e Rules Interface --- Build Specification

## 1. Purpose

Build a local rules-reference interface from
`hero-rulebook-rules.organized-v7.json`.

The interface must present the retained Champions 4e rules in the same
logical order and hierarchy as the cleaned source material, while
treating printed page numbers only as source references. It must be
designed for fast rules lookup and cross-reference navigation rather
than for reproducing the original page layout.

The current dataset contains **630 logical sections**, **24 top-level
sections**, and **169 retained table-image references**. The JSON is the
authoritative content source for the interface. The original PDF is not
required at runtime.

The previous preservation-audited hierarchical v6 organization remains
the fallback data organization if the v7 organization proves unsuitable.
Do not overwrite or discard that fallback.

## 2. Source Files and Expected Project Layout

The project should expect this basic layout:

``` text
project/
├─ data/
│  └─ hero-rulebook-rules.organized-v7.json
├─ images/
│  ├─ p018-table01.webp
│  ├─ p018-table02.webp
│  └─ ...all other retained table images...
├─ src/
│  └─ application source
└─ README / build files
```

The JSON table records already refer to image paths such as
`images/p138-table01.webp`. Preserve those relative paths unless there
is a compelling implementation reason to normalize them during the
build.

The current working directory available while this specification was
written does **not** contain the earlier project ZIP, so this
specification does not assume a particular framework or ZIP structure.
It assumes that the retained `images/` directory from that package will
be placed alongside the JSON as shown above.

## 3. Core Data Model

The interface must consume the recursive v7 schema directly.

Each rules section can contain:

``` json
{
  "heading": "SECTION TITLE",
  "source": {
    "pageStart": "136",
    "pageEnd": "138",
    "pages": ["136", "137", "138"]
  },
  "text": "Rules prose belonging directly to this section.",
  "tables": [],
  "sections": []
}
```

`text`, `tables`, and `sections` are optional. A section is valid when
it contains any one of them. A table-only section is valid and must be
displayed.

Do not reorganize the rules by page. `source` exists for
citation/reference display only.

## 4. Navigation Model

Every section at every depth is a navigable rules article.

The left navigation should render the recursive hierarchy as an
expandable tree:

``` text
POWERS
  ├─ CATEGORIES OF POWERS
  ├─ STANDARD POWERS
  │   ├─ Entangle
  │   ├─ Energy Blast
  │   └─ ...
  └─ ...
```

Selecting any heading, subheading, subsubheading, or deeper descendant
opens that section as the primary article.

The interface must support arbitrary nesting depth. Do not hard-code
only three levels.

Each article view should show:

1.  The section heading.
2.  Breadcrumbs showing its ancestors.
3.  Its printed source page or page range.
4.  Its direct prose.
5.  Its direct tables, in source order.
6.  Its child sections, either rendered beneath it or exposed as
    immediately accessible child links.
7.  Links to the previous and next logical sections in book order.

A useful breadcrumb example is:

``` text
Powers > Standard Powers > Entangle
```

## 5. Stable Section IDs and Routes

Every section must receive a deterministic, stable internal ID during
indexing.

Preferred route form:

``` text
/rules/powers/standard-powers/entangle
```

Create the route from the full ancestry, not merely the final heading.
This prevents collisions between identically named headings in different
parts of the book.

Slug rules:

-   lowercase;
-   trim leading/trailing whitespace;
-   convert punctuation and whitespace runs to `-`;
-   remove characters unsafe in a URL;
-   preserve the ancestry in the route;
-   if two complete ancestry routes still collide, append a
    deterministic suffix based on source page, not a random value.

Never use the printed page number as the primary route.

## 6. Global Automatic Cross-Linking

This is a mandatory feature.

**Every heading at every level must become a recognized link target
throughout the entire rules project.**

For example, if body text says:

> An Entangle can be attacked...

the displayed word **Entangle** must automatically link to the section
whose heading is `Entangle`.

This applies equally to top-level headings, subheadings, subsubheadings,
and deeper nested headings.

### 6.1 Build a Global Heading Index

At application startup or build time, recursively traverse every section
and construct a heading index.

Each entry should contain at least:

``` ts
{
  title: "Entangle",
  normalizedTitle: "entangle",
  route: "/rules/powers/.../entangle",
  ancestry: ["Powers", "...", "Entangle"],
  pageStart: "..."
}
```

Do not manually maintain a list of rule names. The link dictionary must
be generated from the JSON itself so that newly added headings
automatically become linkable.

### 6.2 Matching Rules

Automatic linking should:

-   be case-insensitive;
-   preserve the capitalization of the displayed source text;
-   match complete terms, not substrings inside unrelated words;
-   prefer the **longest matching heading** when headings overlap;
-   support headings containing spaces, hyphens, apostrophes, numbers,
    and common punctuation;
-   not alter the underlying JSON;
-   be performed at render/index time.

Example:

``` text
Body text:
"The character may use Hand-to-Hand Killing Attack..."

Rendered:
"The character may use [Hand-to-Hand Killing Attack](its generated route)..."
```

### 6.3 Do Not Link These Locations

Do not auto-link:

-   the heading currently being displayed to itself;
-   text already inside a hyperlink;
-   URLs;
-   code/preformatted text;
-   route/metadata fields;
-   image filenames;
-   source-page labels;
-   HTML attributes;
-   partial words.

Avoid excessive recursive linking inside navigation labels. Navigation
headings are already links and do not need linkification.

### 6.4 Duplicate Heading Names

The current dataset contains **63 normalized heading names that occur
more than once**, so duplicate-name handling is required.

When a heading name has only one target, link it directly.

When multiple sections share the same normalized heading:

1.  Prefer a target in the current article's nearest common ancestor.
2.  If one candidate is in the same top-level rules division and the
    others are not, prefer the same-division candidate.
3.  If context still does not uniquely resolve the term, do **not
    silently choose an arbitrary target**.
4.  In an ambiguous case, either:
    -   leave the term unlinked and provide an ambiguity tooltip/menu,
        or
    -   link to a small disambiguation view listing the matching
        sections with breadcrumbs and page references.

The interface must never send a reader to a random same-named heading.

### 6.5 Plurals and Variants

Initially, automatic linking should use exact heading phrases,
case-insensitively.

Do not automatically stem words or invent aliases. For example, do not
assume that a heading named `Entangle` means every occurrence of
`Entangles` unless an alias system is explicitly added.

A later alias layer may support known variants, but canonical heading
matching must remain the foundation.

## 7. Rendering Rules Content

Preserve paragraph order and wording from the JSON. The interface may
improve typography, but it must not rewrite rules prose.

Render ordinary text as readable paragraphs. Preserve meaningful line
breaks when the source uses them for lists, examples, formulas, or short
rule statements.

Recognize common HERO notation without changing it:

-   `1/2d6`
-   `2d6`
-   `OCV`
-   `DCV`
-   `EGO`
-   `BODY`
-   `STUN`
-   `END`
-   distances such as `8"`

Do not apply smart substitutions that could alter game notation.

## 8. Tables and Images

All retained table references must be rendered in the section to which
they are attached.

A table-only section such as `HEARING PERCEPTION MODIFIERS` is a full
article even if it has no prose.

Image behavior:

-   resolve the table's relative `images/...` path;
-   display at a readable width without stretching;
-   allow click/tap to enlarge;
-   preserve aspect ratio;
-   provide a clear missing-image placeholder if the asset is
    unavailable;
-   do not silently hide a missing table;
-   use the section heading as contextual accessible text when the table
    asset has no better description.

The interface should not display removed non-table artwork.

## 9. Source Page References

Every article should display its printed book source discreetly, for
example:

``` text
Source: Champions 4e, pp. 17–18
```

For supplement labels, preserve the labels exactly rather than coercing
them to ordinary integers.

Source pages are reference metadata only. Clicking a page number should
not change the fundamental organization of the rules.

If a PDF viewer is added later, page references may optionally link to
the corresponding source page, but the rules interface must not depend
on the PDF.

## 10. Search

Provide full-text search across:

-   headings;
-   body text;
-   breadcrumb/ancestry names.

Search results should display:

-   matched heading;
-   breadcrumb;
-   a short text excerpt around the match;
-   printed page reference.

Heading matches should rank above body-text-only matches.

Selecting a search result opens the corresponding logical article, not a
page container.

## 11. Article Contents

When an article contains child sections, show a compact local contents
list near the top.

Example:

``` text
Power Advantages
  Armor Piercing
  Autofire
  Based on ECV
  ...
```

Every entry is a normal section link.

For very large sections, child sections may be collapsed initially, but
they must remain discoverable without requiring search.

## 12. Backlinks

Because automatic cross-linking creates a rules network, maintain a
reverse-link index.

An article may optionally show:

``` text
Referenced by
- Energy Blast
- Power Advantages
- Combat Modifiers
```

This should be generated from actual resolved automatic links, not
guessed from keyword searches.

Backlinks are useful but secondary; they should not clutter the primary
rules text.

## 13. Hover / Preview Behavior

On desktop, hovering a rules cross-link may show a small preview
containing:

-   target heading;
-   breadcrumb;
-   source page;
-   first short paragraph or first approximately 200 characters.

On touch devices, normal navigation is sufficient.

Do not place entire rules articles in hover cards.

## 14. Reading Behavior

Opening a parent section should not require the reader to click through
every child merely to read the material in sequence.

Support two useful modes:

**Article mode:** show the selected section's direct content and its
immediate child navigation.

**Read-through mode:** recursively render the selected section and all
descendants in book order, with every descendant heading retaining its
own anchor and route target.

Read-through mode is particularly useful for reading a complete chapter.

## 15. Deep Linking and Browser History

Every section must be directly addressable.

The following must work correctly:

-   opening a copied section URL;
-   browser Back and Forward;
-   refreshing a deep-linked article;
-   opening a rules link in a new tab;
-   linking directly to a nested subsection.

If the implementation is a single-page application, configure route
fallback appropriately.

## 16. Link Generation Algorithm

A practical implementation is:

1.  Traverse the JSON recursively.
2.  Assign stable routes.
3.  Build the canonical heading index.
4.  Build a matcher sorted by heading length descending.
5.  Parse rendered body text into text nodes.
6.  Ignore protected nodes such as existing links and code.
7.  Find complete-term matches.
8.  Resolve each match against the heading index.
9.  Replace unambiguous matches with internal links.
10. Record the resolved source → target pair for backlinks.
11. Leave ambiguous matches unresolved or expose disambiguation.

Do **not** repeatedly run regular-expression replacement over already
generated HTML. That tends to create nested links and corrupt markup.
Linkify text nodes before or during rendering.

For a large client-side implementation, a trie/Aho-Corasick matcher is
preferable to hundreds of repeated regular expressions, although a
carefully escaped longest-first regular expression is acceptable at this
dataset's size if performance is good.

## 17. Heading Normalization for Linking

Use two representations:

**Display title:** exactly what the rules data says.

**Normalized lookup title:** used only for matching.

Recommended normalization:

``` text
Unicode normalize
→ trim
→ collapse internal whitespace
→ normalize typographic apostrophes/quotes to comparison equivalents
→ case-fold
```

Do not strip meaningful words or punctuation so aggressively that
different game terms collapse into one lookup key.

## 18. Interface Layout

A practical desktop layout:

``` text
┌──────────────────────────────────────────────────────────┐
│ Search                                                   │
├───────────────────┬──────────────────────────────────────┤
│ Rules hierarchy   │ Breadcrumbs                          │
│                   │                                      │
│ Character Creation│ ENTANGLE                             │
│ Characteristics   │ Source: p. XX                        │
│ Skills            │                                      │
│ Talents           │ Rules prose with automatic links... │
│ Powers            │                                      │
│   ...             │ [table/image where applicable]      │
│                   │                                      │
│                   │ Child sections / article contents    │
└───────────────────┴──────────────────────────────────────┘
```

On narrow screens, collapse the hierarchy into a drawer/menu.

Prioritize reading space. This is a reference tool, not a reproduction
of the book's graphic design.

## 19. Visual Treatment

Use restrained rulebook/reference styling:

-   highly readable body font;
-   clear visual distinction between hierarchy levels;
-   modest maximum line width;
-   tables/images centered or aligned consistently;
-   internal rules links visibly distinct from ordinary prose;
-   breadcrumbs and page references visually subordinate to rules text;
-   no decorative UI that interferes with rapid lookup.

Dark mode is optional, but if implemented, table images should remain
legible against the surrounding background.

## 20. Data Integrity Requirements

The interface must never modify the source rules text merely to improve
presentation.

At build/test time, verify:

-   every JSON section receives a route;
-   every route is unique;
-   every retained table path is accounted for;
-   no section is an empty leaf;
-   every auto-link target resolves to an existing route;
-   ambiguous duplicate headings are never arbitrarily resolved;
-   all 169 retained table references remain reachable;
-   the hierarchy remains in source order.

The current v7 dataset was produced from a preservation-audited source.
Structural processing in the interface must not discard content.

## 21. Recommended Generated Indexes

These should be generated from the JSON rather than manually stored in
the source data:

``` ts
sectionByRoute
sectionsByNormalizedHeading
childrenByRoute
parentByRoute
previousSectionByRoute
nextSectionByRoute
searchIndex
backlinksByRoute
```

This keeps the rules JSON focused on source content while allowing the
application to maintain whatever derived indexes it needs.

## 22. Optional Future Features

These are useful but should not complicate the first implementation:

-   bookmarks/favorites;
-   recently viewed rules;
-   copy-link-to-section;
-   keyboard shortcut to focus search;
-   print-friendly article mode;
-   backlinks;
-   hover previews;
-   aliases for common terminology;
-   optional source-PDF jump links;
-   user notes stored separately from rules data.

User notes, bookmarks, aliases, and other application metadata should
**not** be written into the authoritative rules JSON.

## 23. Acceptance Tests

The implementation is not complete until these behaviors work:

1.  Search for `Entangle`; open its article.
2.  Find another article whose body text contains the standalone term
    `Entangle`.
3.  Confirm that occurrence automatically links to the same Entangle
    article.
4.  Confirm the Entangle article does not link its own heading to
    itself.
5.  Confirm a multi-word heading is preferred over a shorter heading
    contained inside it.
6.  Confirm duplicate heading names are disambiguated rather than
    arbitrarily linked.
7.  Confirm a table-only article renders normally.
8.  Confirm all retained table images load from the image package.
9.  Confirm a multi-page section displays as one article with one source
    range.
10. Confirm direct URLs to deeply nested sections survive refresh.
11. Confirm the browser Back button returns to the previous rules
    article.
12. Confirm every hierarchy item is clickable.
13. Confirm read-through mode preserves the book's logical order.
14. Confirm automatic linking does not alter URLs, code, metadata, or
    already-linked text.
15. Confirm all **169** retained table references are reachable through
    the interface.

## 24. Non-Negotiable Design Principle

The interface is a navigation and presentation layer over the cleaned
rules data.

**The hierarchy determines where a rule lives. The heading index
determines what can be linked. Page numbers tell the reader where the
material came from. None of those mechanisms should rewrite, omit, or
reinterpret the rules themselves.**

Every logical heading in the JSON is both:

1.  a place the reader can navigate to; and
2.  a term that the application can automatically recognize and
    cross-link when it appears in rules prose.

That behavior should be derived automatically from the data so the
project remains maintainable as the rules JSON is corrected or expanded.
