# Campaign Wiki Version 4 Planning

## Objective

Version 4 should make Campaign Wiki reusable across campaign worlds running different Foundry game systems. The module should have a system-neutral core. Golden Age Agents terminology, artwork, categories, and HERO-specific behavior should be represented by world configuration rather than universal assumptions.

Version 3 should retain its established structure. Reserve the larger architectural changes in this document for version 4 rather than destabilizing the current campaign.

## World Profile

Introduce a configurable **Campaign Wiki World Profile** containing:

- Display names and ordering for top-level roots.
- Starter categories that may be renamed, omitted, or replaced.
- Relationship wording and relationship-section ordering.
- Available Current Status choices and the default status for new Articles.
- Other new-Article defaults, including visibility and date behavior.
- Category-specific fallback artwork.
- Automatic Article-linking categories and behavior.
- Article of the Day visibility, eligibility, frequency, and category selection.
- Optional Foundry-system field mappings and adapters.

The Golden Age Agents world should retain its existing configuration as a Golden Age/HERO-oriented profile. New worlds should begin with a neutral profile.

## Stable Internal Structure

Do not begin by changing existing internal root IDs. Keep stable internal identifiers for export, import, migration, and upgrade safety while allowing each world to customize their displayed names, ordering, defaults, and behavior.

Evaluate fully custom roots only after configurable labels and starter categories have proven insufficient.

## Areas to Generalize

### In-app documentation

- Provide an in-app Campaign Wiki guide rather than relying only on repository documentation.
- Make help accessible from the Wiki itself and from Module Settings.
- Separate player guidance from GM-only creation, relationship, visibility, artwork, configuration, backup, and migration guidance.
- Keep documentation aligned with the active World Profile and installed system adapter so it does not describe unavailable or differently named features.
- Consider contextual help links from complex screens such as Parent Article Paths, relationship wording, category selectors, and artwork organization.

### Terminology and relationships

- Keep labels such as DNPCs, Owns, Arc, Metaplot, and Session configurable per world.
- Allow equivalent terminology such as Episode, Adventure, Chapter, Quest, Chronicle, Case, or Story.
- Preserve neutral factory defaults.
- Allow relationship-section ordering to be configured rather than hard-coded.

### Top-level roots and starter categories

- Make the displayed names and order of Metaplots, Arcs, Places, People, and Images configurable.
- Treat Heroes, Villains, NPCs, Affiliations, Vehicles, Equipment, MacGuffins, Media, Other, and Session Art as profile choices rather than universal categories.
- Permit other campaigns to use concepts such as Factions, Religions, Species, Star Systems, Quests, Clans, or Organizations.

### Current Status

- Make the available status vocabulary configurable per world.
- Permit status choices appropriate to different subjects and genres, including people, organizations, places, and objects.
- Make the default status for new Articles configurable.

### Foundry-system integration

- Keep universal Foundry concepts such as Actors, Scenes, portrait images, and token images in the core.
- Move system-specific source fields behind adapters or configurable field paths.
- In particular, HERO Actor quote autofill should be a HERO adapter rather than a universal assumption.
- Other systems should be able to map another quote field or disable quote autofill.

### Artwork

- Make fallback images configurable for each top-level family.
- Preserve the Golden Age artwork as that world's selections, not mandatory module branding.

### Home page and discovery

- Configure Article of the Day enablement, eligible categories, GM visibility, and whether selection changes per day, login, or refresh.
- Configure Recently Added item count.
- Consider reusing hierarchical category selectors across Article linking and Article of the Day.

### Other useful profile controls

- Configure the collapsed relationship-card count before “... and N others.”
- Configure whether Aliases, Current Status, and First Appearance are player-visible.
- Configure First Appearance calculation conservatively, with choices such as direct Sessions only or direct Sessions plus directly related Arcs.
- Configure individual Needs Actioning checks if practical.

## Keep as layout decisions

Avoid exposing every presentation measurement. Font sizes, card dimensions, sidebar width, thumbnail dimensions, and article-column proportions should normally remain part of the tested layout system so worlds cannot easily create broken combinations.

## Migration expectations

- Upgrading an existing v3 world must preserve its content, relationships, visibility, terminology, fallback artwork, and behavioral choices.
- Convert existing v3 settings into an explicit world profile during migration.
- Never replace later user customization during startup initialization.
- Exports should contain enough profile information to reproduce the wiki in another compatible world.
