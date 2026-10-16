import assert from "node:assert/strict";
import test from "node:test";
import { cleanJobDescription } from "./JobDescriptionService.js";

test("converts job description HTML into readable plain text", () => {
  const description = cleanJobDescription(
    "<h2>Responsibilities</h2><ul><li>Build &amp; test</li><li>Ship &#x1F680;</li></ul><p>Work remotely.</p>"
  );

  assert.equal(
    description,
    "Responsibilities\n\n• Build & test\n• Ship 🚀\n\nWork remotely."
  );
});

test("removes scripts and styles from job descriptions", () => {
  const description = cleanJobDescription(
    "<p>Safe role</p><script>alert('unsafe')</script><style>.hidden{display:none}</style>"
  );

  assert.equal(description, "Safe role");
  assert.doesNotMatch(description, /alert|display/);
});
