# Nakamura News and Sundries — ticker and shelves

## Stock and ticker

The Newspapers, Magazines, Comics, Books, and Postcards category articles are children of both Media and Nakamura News and Sundries. Their contents automatically supply the shelves, including nested items. Individual items do not need a relationship to Nakamura. Category articles themselves are excluded from stock, even when they have a Quote. Existing direct Media-to-newsstand relationships remain supported.

A nonblank existing Quote makes a stocked item eligible for the ticker and newspaper sections. There is no newspaper checkbox or separate headline field. The article Date selects the latest item, descending, with creation timestamp and ID breaking ties. Session dates do not override it. Undated items follow dated items.

The custom Place is resolved by the unique title or alias `Nakamura News and Sundries` or `Ken's Newsstand`. Normal renames preserve the former title as an alias. Ambiguous matches disable custom behavior. No live world ID was available locally.

## Layout

- The homepage ticker always opens Nakamura News and Sundries. Its headline still comes from the latest qualifying Media article's Quote.
- Today's Paper appears beneath the description, alongside the artwork/status/aliases column, and opens the newspaper article itself.
- Back Numbers shows the five preceding eligible articles, excluding Today's Paper.
- Magazines & Periodicals, Comic Books, Books for Your Leisure, Picture Post Cards, and Sundries follow in that order. Each shows up to five items newest first in a vertical list.
- Existing location, NPC, and other relationships remain below the shelves; stock is omitted from those generic relationship lists to avoid duplicates.
- Empty sections are hidden. Player visibility is honored throughout, including visibility of the stand itself.

## Shelf classification

Unquoted stock uses existing category ancestors beneath Images > Media: Newspapers, Magazines/Periodicals/Pulps, Comics/Comic Books, Books, and Postcards/Post Cards. Newspapers without Quotes appear in a Newspapers shelf after Back Numbers so they remain available without becoming ticker headlines. No classification is guessed from the stocked article's title. Unclassified or ambiguously classified direct stock appears under Sundries. Quoted stock always goes to the newspaper sections, regardless of category. Hidden shelf categories do not supply player stock. Items in multiple shelves are deduplicated.

## Changed files

- scripts/latest-newspaper.js — stock resolver, date selection, ticker, shelves and cards.
- scripts/campaign-wiki.js — description placement, shelf placement, relationship filtering, removal of classification checkbox.
- scripts/unified-core.js — removed the former newspaper boolean normalization; existing unused stored properties are harmless and not consulted.
- styles/campaign-wiki.css — ticker accessibility and shelf card styles.
- test/latest-newspaper.test.mjs — revised rules and integration tests.

## Validation

Validation covers category-driven membership, all five shelves, nested contents, duplicate relationships, category removal, hidden categories, and the existing ticker rules. Live Foundry visual verification has not been performed. These are local source changes, not an installed release or deployment.
