# Telegrams — Campaign Wiki 3.0.35

## Setup
1. Restart/reload the world as GM. The wiki adds **Images → Media → Telegrams** if absent.
2. Confirm each player's **assigned character** in Foundry User Configuration. Actor ownership alone does not assign telegram delivery.
3. Create an ordinary article with **Telegrams** and the recipient's Actor article as parents. Additional NPC Actor parents may record the sender.
4. Enter the written addressee in the existing **Aliases** control. The first alias supplies the delivery notice; missing aliases show “TELEGRAM WAITING!”
5. Set **Current Status: Active** and use the ordinary Media image uploader for artwork.

Exactly one Actor parent must be assigned to exactly one non-GM, non-Gametable account. Missing or ambiguous assignments disable delivery and appear as GM warnings. No named player or hero assignment is hard-coded. The reserved generic account name Gametable is explicitly excluded (case-insensitive).

## Delivery and archive
The recipient's Home page shows one envelope notice for the oldest waiting telegram. Article Date orders delivery; creation time and article ID supply deterministic fallbacks. Opening commits Current Status to Inactive, and the next waiting telegram becomes available. Opening as GM or in GM Player Preview never consumes it.

Active telegrams are absent from all parent relationship sections, including the GM's. Inactive telegrams appear in the ordinary **Telegrams** section on each related parent: newest five, followed by “… and N more” using the existing expand control. Ordinary article visibility governs the archive, so configure the usual parent/article visibility for the desired audience.

Automatic article linking excludes Telegram content and Telegram targets, including archived telegrams. Explicit relationships remain intact. Telegrams are excluded from newspaper stock so a quote never becomes a public newspaper headline. Reduced-motion preferences disable the notice animation.

## Runtime and privacy boundaries
- A connected GM is required to commit the player's read transition, because only GMs can write the existing world database. With no GM online, opening reports this and leaves the article Active.
- The player sends a transient request through their own Foundry User flag. The elected active GM validates the server-supplied initiating user and the current assignment, then changes the existing Current Status. Requests are serialized and overlapping opens share one request. These flags are request/reply transport, not an inbox or a second unread state.
- Privacy is enforced before wiki graph rendering, including search, navigation, direct article access, parent relationships, counts, dates, maps, and the module's getDatabase API. GM Player Preview receives no recipient privileges.
- **The existing world-setting storage is client-readable. This implementation does not provide confidentiality against developer-console inspection of Foundry settings or direct access to an uploaded image URL.** Server-protected storage and protected artwork hosting would be a separate architectural change. No duplicate inbox or permission database was introduced.
- User/character assignment changes refresh the wiki and are rechecked on delivery.

## Validation
The command npm run check runs syntax checks and the full regression suite. Telegram tests exercise policy, actual homepage/parent/direct-page renderers, archive expansion, ordering, GM preview, reduced-motion CSS, and simulated authenticated multi-client delivery, spoof rejection, overlapping requests, and offline-GM behavior.

Live Foundry/Forge testing is still required before campaign use. The packaged ZIP is a local build; no GitHub release or live world was updated.

Foundry API reference: https://foundryvtt.com/api/v13/classes/foundry.documents.User.html
