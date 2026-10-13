# Campaign Wiki 3.0.52

## Article paste formatting

- Preserve paragraph and heading boundaries when Article Text is pasted from rich-text sources.
- Normalize Windows, classic Mac, and Unicode line separators before saving.
- Recover paragraph breaks from long clipboard payloads that flatten them into repeated spaces.
- Do not rewrite intentional spacing during an ordinary Article save.

## Verification

- Regression coverage includes all supported line separators and the flattened rich-text fallback.
- The supplied SIGMA article fixture recovers 56 paragraphs from a single flattened line.
