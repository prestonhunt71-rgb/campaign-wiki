import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/campaign-wiki.js", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../module.json", import.meta.url), "utf8"));

test("Campaign Wiki does not load or expose the separate Rulebook module", () => {
  assert.doesNotMatch(source, /installRulebook|renderCollectedRules|openRulebook|data-action=["']rulebook/);
  assert.ok(!manifest.styles.includes("styles/rulebook.css"));
  for (const path of [
    "../scripts/rulebook.js",
    "../scripts/rulebook-core.js",
    "../scripts/rulebook-import.js",
    "../styles/rulebook.css"
  ]) {
    assert.equal(fs.existsSync(new URL(path, import.meta.url)), false, `${path} must remain outside Campaign Wiki`);
  }
});
