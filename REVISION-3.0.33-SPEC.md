# Campaign Wiki v3.0.33 - Nakamura newsstand and newspaper ticker

Adds a compact, clickable newsboy ticker beneath the Home introduction, using the newest dated stocked Media article with an existing Quote. Reduced-motion users receive static text, and hover or keyboard focus reveals the complete headline.

Nakamura News and Sundries now shows Today's Paper beneath its description, followed by Back Numbers and shelves for newspapers, magazines, comics, books, and postcards. Each shelf shows up to five items newest first. Existing location and NPC relationships follow the shelves.

The Newspapers, Magazines, Comics, Books, and Postcards category articles should be children of both Media and Nakamura. Their contents automatically stock the shelves; individual items need no separate Nakamura relationship. Quoted stock supplies the ticker and newspaper features. Newspapers without Quotes remain available on their own shelf. No additional headline field or checkbox is required.

Player visibility applies to stock and categories. Existing article data and direct stock links remain supported; no import or migration is required.

Validation: all 69 automated tests pass and JavaScript syntax checks pass. Live Foundry visual verification has not been performed.

Update Campaign Wiki to 3.0.33 and reload the world.
