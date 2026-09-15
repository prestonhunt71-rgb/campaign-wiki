# Revision 3.0.37 — Telegram sidebar notice

Moves the Home telegram delivery button into the bottom portion of the left wiki sidebar. Navigation scrolls above it, long addressees wrap within the button, and the notice remains attached to the wiki window.

The notice displays TELEGRAM FOR {Alias}! using the first nonblank Alias on the Telegram article. The existing Alias editor now explains its use as the delivery addressee. When no Alias is saved, the notice retains TELEGRAM WAITING! rather than inventing a name.

All 87 regression tests pass, including actual sidebar rendering, recipient-only display, GM preview, and first-nonblank-Alias handling. The existing reduced-motion behavior remains supported.
