/* Writes SCENARIOS.md from the scenario registry, so the two can't drift apart. */
import { writeFileSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { SCENARIOS, AREAS } = await server.ssrLoadModule(
  "/src/aurora/scenarios/registry.ts",
);
await server.close();

const cell = (text) => text.replaceAll("|", "\\|");
const built = SCENARIOS.filter((s) => s.built).length;

const lines = [
  "# Scenarios",
  "",
  "Generated from `src/aurora/scenarios/registry.ts`. Run `npm run docs:scenarios` after changing it.",
  "",
  `**${built} of ${SCENARIOS.length} built.** Open any scenario at \`http://127.0.0.1:5173/?scenario=ID\`, or from the switcher (Alt+S).`,
  "",
  "A source of `gap` means no Figma frame covers it: see `GAPS.md`. Unbuilt scenarios load the base course only.",
];

for (const [area, name] of Object.entries(AREAS)) {
  lines.push(
    "",
    `## ${area}: ${name}`,
    "",
    "| ID | Scenario | Status | How to trigger | What you should see | Figma source | UI reference |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const s of SCENARIOS.filter((scenario) => scenario.area === area)) {
    const status = s.built ? "Built" : `Phase ${s.phase}`;
    lines.push(
      `| ${s.id} | ${cell(s.title)} | ${status} | ${cell(s.trigger)} | ${cell(s.see)} | ${s.source} | ${cell(s.references.join("; ")) || "None"} |`,
    );
  }
}

writeFileSync("SCENARIOS.md", `${lines.join("\n")}\n`);
console.log(`SCENARIOS.md: ${built}/${SCENARIOS.length} built`);
