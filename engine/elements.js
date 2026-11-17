/* Engine: reads the element files and checks them for problems.
   The web page uses this file, and so does the automatic Sand check that
   runs on GitHub whenever someone opens a pull request.
   You don't need to edit this file. */

const Elements = (() => {
  const MOVES = ["stays", "falls", "flows", "rises"];
  const WEIGHT = { stays: 0, falls: 3, flows: 2, rises: 1 };
  const THEMES = ["night", "day", "space", "paper"];
  const NAME = /^[a-z0-9][a-z0-9-]*$/;
  const MAX_ELEMENTS = 250;
  const SETTINGS = ["color", "moves", "weight", "lasts", "then becomes"];

  // Every color name a web browser knows.
  const COLORS = {};
  ("aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 " +
   "black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 " +
   "chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff " +
   "darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 " +
   "darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 " +
   "darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f " +
   "darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 " +
   "dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc " +
   "ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 grey 808080 green 008000 greenyellow adff2f " +
   "honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa " +
   "lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff " +
   "lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 " +
   "lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 " +
   "lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 " +
   "mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 " +
   "mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 " +
   "midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 " +
   "oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa " +
   "palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f " +
   "pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f " +
   "royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee " +
   "sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa " +
   "springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 " +
   "violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32")
    .split(" ").forEach((w, i, all) => { if (i % 2 === 0) COLORS[w] = "#" + all[i + 1]; });

  // Comments (<!-- like this -->) are notes. Blank them out but keep their
  // line breaks, so line numbers in messages still match the file.
  function stripComments(text) {
    return String(text || "").replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ""));
  }

  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        // Two letters swapped ("fier" for "fire") counts as one mistake.
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  function closest(name, names) {
    let best = null, bestD = Infinity;
    for (const n of names) {
      const dd = distance(name, n);
      if (dd < bestD) { best = n; bestD = dd; }
    }
    return bestD <= (name.length <= 4 ? 1 : Math.max(2, Math.floor(name.length / 4))) ? best : null;
  }

  // "#e2c290", "#fc0", "orange", "sky blue" -> [r, g, b], or null.
  function parseColor(text) {
    let c = text.trim().toLowerCase().replace(/\s+/g, "");
    if (COLORS[c]) c = COLORS[c];
    let m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(c);
    if (m) return [m[1], m[2], m[3]].map((h) => parseInt(h + h, 16));
    m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(c);
    if (m) return [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
    return null;
  }

  // ---------- list.txt ----------

  function readList(text) {
    const list = { title: "", theme: "night", files: [], problems: [] };
    const problem = (level, line, message, fix) =>
      list.problems.push({ level, file: "list.txt", line, message, fix: fix || "" });
    const lines = stripComments(text).split("\n");
    const seen = new Set();
    lines.forEach((raw, i) => {
      const n = i + 1;
      const line = raw.trim();
      if (!line) return;
      const set = /^([a-z][a-z ]*?)\s*:\s*(.*)$/i.exec(line);
      if (set && !/\.txt$/i.test(line)) {
        const key = set[1].toLowerCase(), value = set[2].trim();
        if (key === "title") list.title = value;
        else if (key === "theme") {
          const t = value.toLowerCase();
          if (THEMES.includes(t)) list.theme = t;
          else {
            const near = closest(t, THEMES);
            problem("error", n, `There's no theme called "${value}".`,
              near ? `Did you mean theme: ${near}?` : `Use one of: ${THEMES.join(", ")}.`);
          }
        } else {
          const near = closest(key, ["title", "theme"]);
          problem("error", n, `list.txt doesn't have a setting called "${set[1]}".`,
            near ? `Did you mean ${near}:?` : "list.txt only has title: and theme:, plus the names of element files, one per line.");
        }
        return;
      }
      if (/\.txt$/i.test(line)) {
        if (/[\\/]/.test(line)) {
          problem("error", n, `"${line}" has a folder in it.`, `Write just the file name, like ${line.split(/[\\/]/).pop()}. Every element file lives in the elements folder.`);
          return;
        }
        if (seen.has(line)) { problem("warning", n, `${line} is listed twice.`, "Delete one of the two lines."); return; }
        if (/\s/.test(line)) problem("warning", n, `The file name "${line}" has a space in it.`, `Spaces in file names cause trouble on the web. Rename the file to ${line.replace(/\s+/g, "-")} and change this line to match.`);
        seen.add(line);
        list.files.push({ name: line, line: n });
        return;
      }
      problem("error", n, "list.txt lists element files, one per line. I don't understand this line.",
        /^[\w-]+$/.test(line) ? `If it's a file, write the whole name: ${line}.txt` : "Each line should be a file name like basics.txt, or title: / theme:. Notes go between <!-- and -->.");
    });
    return list;
  }

  // ---------- element files ----------

  function parseFile(f, out, problem) {
    const file = { name: f.name, by: "", elements: [] };
    out.files.push(file);
    const lines = stripComments(f.text).split("\n");
    let el = null;
    lines.forEach((raw, i) => {
      const n = i + 1;
      const line = raw.trim().replace(/\s+/g, " ");
      if (!line) return;
      const low = line.toLowerCase();

      // A new element: ## name
      let m = /^(#+)\s*(.*)$/.exec(line);
      if (m) {
        if (m[1].length !== 2) {
          problem("error", f.name, n, `Element names start with exactly two #, but this line has ${m[1].length}.`, `Write it like this: ## ${m[2].trim().toLowerCase().replace(/\s+/g, "-") || "sand"}`);
          if (m[1].length === 1 && !m[2].trim()) return;
        }
        const rawName = m[2].trim();
        let name = rawName.toLowerCase().replace(/\s+/g, "-");
        if (!rawName) {
          problem("error", f.name, n, "This ## line has no element name after it.", "Write the name after the ##, like ## sand");
          el = null;
          return;
        }
        if (/\s/.test(rawName)) {
          problem("error", f.name, n, `Element names can't have spaces: "${rawName}".`, `Use dashes instead: ## ${name} (and write ${name} in rules, too).`);
        } else if (!NAME.test(name)) {
          problem("error", f.name, n, `"${rawName}" can't be an element name.`, "Use only lowercase letters, numbers and dashes, like ## hot-lava");
          name = name.replace(/[^a-z0-9-]/g, "") || "element-" + n;
        }
        if (name === "empty") {
          problem("error", f.name, n, `"empty" is already taken: it means blank space.`, "Pick a different name for this element.");
        }
        el = { name, file: f.name, line: n, colors: [], moves: null, weight: null, lasts: null, then: null, becomes: [], turns: [], tried: {} };
        file.elements.push(el);
        out.elements.push(el);
        return;
      }

      // Before the first element: only by:
      if (!el) {
        m = /^by\s*:\s*(.*)$/i.exec(line);
        if (m) { file.by = m[1].trim(); return; }
        if (/^(title|theme)\s*:/i.test(line)) {
          problem("error", f.name, n, `${line.split(":")[0].trim()}: belongs in list.txt, not in an element file.`, "Move this line to elements/list.txt.");
          return;
        }
        problem("error", f.name, n, "This line is above the first element, so it doesn't belong to any element.",
          "Every element starts with a line like ## sand. Put this line under one, or turn it into a note with <!-- and -->.");
        return;
      }

      // Settings: color, moves, weight, lasts, then becomes
      m = /^colou?rs?\s*:\s*(.*)$/i.exec(line);
      if (m) {
        el.tried.color = true;
        const parts = m[1].split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.length) problem("error", f.name, n, "color: needs at least one color after it.", "For example: color: orange, or color: #e2c290, #d4b483");
        for (const p of parts) {
          const rgb = parseColor(p);
          if (rgb) { el.colors.push({ text: p, rgb, line: n }); continue; }
          const near = /^#/.test(p) ? null : closest(p.toLowerCase().replace(/\s+/g, ""), Object.keys(COLORS));
          problem("error", f.name, n, `"${p}" isn't a color I know.`,
            near ? `Did you mean ${near}?` : "Use a color name like orange or skyblue, or a hex code like #e2c290 (a # and six digits or letters a–f).");
        }
        return;
      }
      m = /^moves?\s*:\s*(.*)$/i.exec(line);
      if (m) {
        el.tried.moves = true;
        const v = m[1].trim().toLowerCase();
        if (MOVES.includes(v)) el.moves = v;
        else {
          const near = closest(v, MOVES);
          problem("error", f.name, n, `"moves: ${m[1].trim()}" isn't a way to move.`,
            near ? `Did you mean moves: ${near}?` : "Use one of: stays, falls (piles up like sand), flows (spreads like water), rises (floats up like smoke).");
        }
        return;
      }
      m = /^weight\s*:\s*(.*)$/i.exec(line);
      if (m) {
        const v = Number(m[1].trim());
        if (m[1].trim() !== "" && isFinite(v) && v >= 0 && v <= 1000) el.weight = v;
        else problem("error", f.name, n, `"weight: ${m[1].trim()}" isn't a weight.`, "Use a number like 3 or 1.5. Heavier things sink through lighter ones.");
        return;
      }
      m = /^lasts\s*:\s*(.*)$/i.exec(line);
      if (m) {
        const r = /^(\d+)(?:\s*(?:-|to)\s*(\d+))?$/i.exec(m[1].trim());
        const lo = r ? +r[1] : 0, hi = r ? +(r[2] || r[1]) : 0;
        if (r && lo >= 1 && hi >= lo && hi <= 60000) el.lasts = [lo, hi, n];
        else problem("error", f.name, n, `"lasts: ${m[1].trim()}" isn't a number of frames.`,
          "Use a whole number, like lasts: 60 (about one second), or a range, like lasts: 20-60.");
        return;
      }
      m = /^then becomes\s*:?\s*(.*)$/i.exec(line);
      if (m) {
        const v = m[1].trim().toLowerCase();
        if (!v) problem("error", f.name, n, "then becomes: needs an element name after it.", "For example: then becomes: smoke");
        else el.then = { name: v, line: n };
        return;
      }

      // Rules: becomes X when touching Y (20%)
      const CHANCE = "(?:\\s*\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*(?:chance)?\\s*\\)?)?";
      m = new RegExp("^becomes\\s+(.+?)\\s+when\\s+(?:it\\s+)?touch(?:es|ing)\\s+(.+?)" + CHANCE + "$", "i").exec(line);
      if (m) {
        const chance = readChance(m[3], f.name, n, problem);
        if (chance) el.becomes.push({ to: m[1].toLowerCase(), touching: m[2].toLowerCase(), chance, line: n });
        return;
      }
      // Rules: turns X into Y (20%)
      m = new RegExp("^turns\\s+(.+?)\\s+into\\s+(.+?)" + CHANCE + "$", "i").exec(line);
      if (m) {
        const chance = readChance(m[3], f.name, n, problem);
        if (chance) el.turns.push({ from: m[1].toLowerCase(), to: m[2].toLowerCase(), chance, line: n });
        return;
      }

      // Anything else: explain what was probably meant.
      if (/^by\s*:/i.test(line)) {
        problem("error", f.name, n, "by: goes at the top of the file, above the first element.", "Move this line up, above the first ## line.");
      } else if (/^(title|theme)\s*:/i.test(line)) {
        problem("error", f.name, n, `${line.split(":")[0].trim()}: belongs in list.txt, not in an element file.`, "Move this line to elements/list.txt.");
      } else if (/^becomes?\b/i.test(low)) {
        problem("error", f.name, n, "I don't understand this line.",
          /when/i.test(low) ? "A becomes rule looks like this: becomes fire when touching lava (20%)"
            : "A becomes rule needs a when: becomes fire when touching lava (20%). To change when it runs out, use lasts: and then becomes: instead.");
      } else if (/^turns?\b/i.test(low)) {
        problem("error", f.name, n, "I don't understand this line.", "A turns rule looks like this: turns water into steam (20%). It changes things this element touches.");
      } else if (/:/.test(line)) {
        const key = low.split(":")[0].trim();
        const near = closest(key, SETTINGS);
        problem("error", f.name, n, `Elements don't have a setting called "${line.split(":")[0].trim()}".`,
          near ? `Did you mean ${near}:?` : `The settings are ${SETTINGS.map((s) => s + ":").join(", ")}.`);
      } else {
        problem("error", f.name, n, "I don't understand this line.",
          "Each line is a setting (color:, moves:, weight:, lasts:, then becomes:) or a rule: becomes fire when touching lava (20%), or turns water into steam. Notes go between <!-- and -->.");
      }
    });
  }

  function readChance(text, file, line, problem) {
    if (text === undefined) return 100;
    const v = Number(text);
    if (v > 0 && v <= 100) return v;
    problem("error", file, line, v === 0 ? "A 0% chance never happens." : `A ${text}% chance is impossible.`,
      "Use a chance between 0.1% and 100%, like (20%). Leave it off for 100%: it happens every time.");
    return 0;
  }

  // ---------- the whole set ----------

  // list: the result of readList. files: [{ name, text }] for each listed file,
  // or { name, missing: true, near } when it couldn't be loaded.
  function build(list, files) {
    const out = { title: list.title, theme: list.theme, list, files: [], elements: [], byName: {}, problems: list.problems.slice() };
    const problem = (level, file, line, message, fix) => out.problems.push({ level, file, line, message, fix: fix || "" });

    for (const f of files) {
      if (f.missing) {
        const entry = list.files.find((e) => e.name === f.name) || { line: 0 };
        problem("error", "list.txt", entry.line, `list.txt says to load ${f.name}, but there's no file called elements/${f.name}.`,
          f.near ? `Did you mean ${f.near}? On the web, capital letters matter.`
            : `Check the spelling, or create it: Add file → Create new file → elements/${f.name}`);
        continue;
      }
      parseFile(f, out, problem);
    }

    // Two elements with the same name: the second one wins nothing.
    const kept = [];
    for (const el of out.elements) {
      const first = out.byName[el.name];
      if (first) {
        problem("error", el.file, el.line, `There are two elements called ${el.name}. The other one is in ${first.file}, line ${first.line}.`,
          "Rename one of them. Every element needs its own name.");
        continue;
      }
      out.byName[el.name] = el;
      kept.push(el);
    }
    out.elements = kept;
    if (kept.length > MAX_ELEMENTS) {
      problem("error", kept[MAX_ELEMENTS].file, kept[MAX_ELEMENTS].line, `The sandbox can hold ${MAX_ELEMENTS} elements, and this one is number ${MAX_ELEMENTS + 1}.`, "Remove some elements.");
      out.elements = kept.slice(0, MAX_ELEMENTS);
    }
    if (!out.elements.length && !files.some((f) => f.missing)) {
      problem("error", "list.txt", 0, "There are no elements yet, so there's nothing to paint with.", "Add an element file to list.txt, with at least one element in it.");
    }

    const names = out.elements.map((e) => e.name).concat(["empty"]);
    const known = (name, el, line, what) => {
      if (names.includes(name)) return true;
      const near = closest(name, names);
      problem("error", el.file, line, /\s/.test(name) ? `"${name}" has a space in it, so it can't be an element name.` : `${what} ${name}, but there's no element called ${name}.`,
        near ? `Did you mean ${near}?` : /\s/.test(name) ? `Element names use dashes instead: ${name.replace(/\s+/g, "-")}` : `Check the spelling, or make an element called ${name} (a line ## ${name}).`);
      return false;
    };

    for (const el of out.elements) {
      if (!el.moves && !el.tried.moves) {
        problem("error", el.file, el.line, `${el.name} needs a moves: line, so the sandbox knows how it moves.`,
          "Add moves: stays (or falls, flows, rises) under ## " + el.name + ".");
      }
      if (!el.moves) el.moves = "stays";
      if (!el.colors.length) {
        if (!el.tried.color) problem("warning", el.file, el.line, `${el.name} has no color, so it's shown in gray.`, "Add a line like color: orange or color: #e2c290.");
        el.colors.push({ text: "gray", rgb: [128, 128, 128], line: el.line });
      }
      if (el.weight === null) el.weight = WEIGHT[el.moves];
      else if (el.moves === "stays") problem("warning", el.file, el.line, `${el.name} stays where it is, so its weight never matters.`, "Delete the weight: line, or change moves:.");
      if (el.then) {
        if (!el.lasts) problem("warning", el.file, el.then.line, `${el.name} has then becomes: but no lasts:, so it never runs out.`, "Add a line like lasts: 60 (about one second). then becomes: happens when that time is up.");
        if (!known(el.then.name, el, el.then.line, "then becomes:")) el.then = null;
        else if (el.then.name === el.name) problem("warning", el.file, el.then.line, `${el.name} becomes ${el.name} when it runs out, so it just starts over.`, "If it should last forever, delete lasts: and then becomes:.");
      }
      el.becomes = el.becomes.filter((r) => {
        const a = known(r.to, el, r.line, "This rule turns it into");
        const b = known(r.touching, el, r.line, "This rule needs it to touch");
        if (a && b && r.to === el.name) problem("warning", el.file, r.line, `This rule turns ${el.name} into ${el.name}, which changes nothing.`, "Change the element after becomes.");
        return a && b;
      });
      el.turns = el.turns.filter((r) => {
        const a = known(r.from, el, r.line, "This rule changes");
        const b = known(r.to, el, r.line, "This rule makes");
        if (a && b && r.from === r.to) problem("warning", el.file, r.line, `This rule turns ${r.from} into ${r.to}, which changes nothing.`, "Change one of the two elements.");
        return a && b;
      });
    }

    const order = (p) => (p.file === "list.txt" ? -1 : list.files.findIndex((e) => e.name === p.file)) * 100000 + p.line;
    out.problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1) || order(a) - order(b));
    return out;
  }

  // ---------- describing an element in plain English ----------

  function seconds(frames) {
    const s = frames / 60;
    return s < 10 ? String(Math.round(s * 10) / 10) : String(Math.round(s));
  }

  function chance(c) { return c >= 100 ? "" : ` (${c}% chance each frame)`; }

  function describe(el) {
    const out = [{
      stays: "Stays where you put it.",
      falls: "Falls and piles up, like sand.",
      flows: "Falls and spreads out, like a liquid.",
      rises: "Floats upward, like a gas.",
    }[el.moves]];
    if (el.moves !== "stays") out.push(`Weight ${el.weight}: heavier things sink below lighter ones.`);
    if (el.lasts) {
      const [lo, hi] = el.lasts;
      const time = lo === hi ? `about ${seconds(lo)} seconds` : `about ${seconds(lo)} to ${seconds(hi)} seconds`;
      out.push(`Lasts ${time}, then ${el.then && el.then.name !== "empty" ? "turns into " + el.then.name : "disappears"}.`);
    }
    for (const r of el.becomes) {
      out.push((r.to === "empty" ? "Disappears" : `Turns into ${r.to}`) + ` when it touches ${r.touching === "empty" ? "empty space" : r.touching}${chance(r.chance)}.`);
    }
    for (const r of el.turns) {
      if (r.from === "empty") out.push(`Fills empty space next to it with ${r.to}${chance(r.chance)}.`);
      else if (r.to === "empty") out.push(`Destroys ${r.from} it touches${chance(r.chance)}.`);
      else out.push(`Turns ${r.from} it touches into ${r.to}${chance(r.chance)}.`);
    }
    return out;
  }

  return { readList, build, describe, closest, parseColor, THEMES, MOVES };
})();

if (typeof module !== "undefined") module.exports = Elements;
