/* Engine: the automatic Sand check. GitHub runs this on every pull request
   and every change to main (see .github/workflows/check.yml). It runs the
   same checks as the web page, and also makes sure every element file is
   listed in list.txt and spelled exactly right. You don't need to edit this file. */

const fs = require("fs");
const path = require("path");
const Elements = require("./elements.js");

const dir = path.join(__dirname, "..", "elements");
const here = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
const problems = [];

let list;
if (here.includes("list.txt")) {
  list = Elements.readList(fs.readFileSync(path.join(dir, "list.txt"), "utf8"));
} else {
  list = Elements.readList("");
  problems.push({ level: "error", file: "list.txt", line: 0,
    message: "The file elements/list.txt is missing, so the sandbox doesn't know which elements to load.",
    fix: "Create elements/list.txt with one element file name per line, like basics.txt" });
}

// The web cares about capital letters, so check the exact spelling.
const files = list.files.map((e) => {
  if (here.includes(e.name)) return { name: e.name, text: fs.readFileSync(path.join(dir, e.name), "utf8") };
  return { name: e.name, missing: true, near: here.find((h) => h.toLowerCase() === e.name.toLowerCase()) };
});
const set = Elements.build(list, files);
problems.push(...set.problems);

// Element files that list.txt doesn't mention are never loaded.
for (const f of here) {
  if (!f.toLowerCase().endsWith(".txt") || f === "list.txt" || list.files.some((e) => e.name === f)) continue;
  if (list.files.some((e) => e.name.toLowerCase() === f.toLowerCase())) continue;
  problems.push({ level: "error", file: f, line: 0,
    message: `elements/${f} isn't in list.txt, so the sandbox never loads it.`,
    fix: `Add a line that says ${f} to elements/list.txt. To do it in the same pull request: click your branch's name near the top of the pull request, open elements → list.txt, click the pencil, add the line, and commit to that same branch.` });
}

const order = (p) => (p.file === "list.txt" ? -1 : Math.max(0, list.files.findIndex((e) => e.name === p.file))) * 1e5 + p.line;
problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1) || order(a) - order(b));
const errors = problems.filter((p) => p.level === "error");
const warnings = problems.filter((p) => p.level === "warning");
const enc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

for (const p of problems) {
  const where = `elements/${p.file}` + (p.line ? `, line ${p.line}` : "");
  console.log(`${p.level === "error" ? "PROBLEM" : "Heads up"}  ${where}\n  ${p.message}\n  ${p.fix}\n`);
  // These lines make GitHub show the message right next to the line it's about.
  console.log(`::${p.level} file=elements/${p.file}${p.line ? ",line=" + p.line : ""},title=${enc(p.message).replace(/[,:]/g, " ")}::${enc(p.message + " " + p.fix)}`);
}

const count = `${set.elements.length} elements from ${set.files.length} file${set.files.length === 1 ? "" : "s"}`;
const summary = errors.length
  ? `## ✗ The sandbox has ${errors.length} problem${errors.length === 1 ? "" : "s"} to fix`
  : "## ✓ The sandbox checks out";
const lines = [summary, "", count + ".", ""];
if (problems.length) {
  lines.push("| | Where | Problem | How to fix it |", "| --- | --- | --- | --- |");
  for (const p of problems) {
    const cell = (s) => String(s).replace(/\|/g, "\\|");
    lines.push(`| ${p.level === "error" ? "🔴" : "🟡"} | elements/${p.file}${p.line ? " line " + p.line : ""} | ${cell(p.message)} | ${cell(p.fix)} |`);
  }
}
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
console.log(summary.replace(/^## /, "") + ` (${count}, ${warnings.length} heads-up)`);
process.exit(errors.length ? 1 : 0);
