/* Engine: the page. Loads the element files, runs the world 60 times a
   second, lets you paint with the mouse (or a finger), and has the tools:
   share links, the draft tester, and the problems list.
   You don't need to edit this file. */

const App = (() => {
  const $ = (id) => document.getElementById(id);
  const S = {
    live: null, list: null, set: null, table: null, world: null, draft: null,
    running: true, speed: 1, acc: 0, brush: 1, selected: 1,
    down: false, last: null, hover: null, undo: null, bg: 0,
    fps: 0, stepMs: 0, ready: false,
  };
  const BRUSH = [0, 1, 3];
  const BG = { night: [11, 15, 26], day: [215, 236, 250], space: [16, 10, 36], paper: [244, 236, 216] };
  const SAVE = "falling-sand-draft:" + location.pathname;
  const canvas = $("world");
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(World.W, World.H);
  const pixels = new Uint32Array(image.data.buffer);

  // ---------- loading ----------

  async function load() {
    const v = "?v=" + Date.now();
    let listText = null;
    try {
      const r = await fetch("elements/list.txt" + v);
      if (r.ok) listText = await r.text();
    } catch (e) { /* offline */ }
    if (listText === null) {
      const list = Elements.readList("");
      list.problems.push({ level: "error", file: "list.txt", line: 0, message: "The file elements/list.txt is missing, so the sandbox doesn't know which elements to load.",
        fix: "Create elements/list.txt with one element file name per line, like basics.txt" });
      return { list, files: [] };
    }
    const list = Elements.readList(listText);
    const files = await Promise.all(list.files.map(async (e) => {
      try {
        const r = await fetch("elements/" + encodeURIComponent(e.name) + v);
        return r.ok ? { name: e.name, text: await r.text() } : { name: e.name, missing: true };
      } catch (err) {
        return { name: e.name, missing: true };
      }
    }));
    return { list, files };
  }

  function rebuild({ list, files }) {
    const keep = S.table ? S.table.kinds[S.selected].name : null;
    S.list = list;
    S.set = Elements.build(list, files);
    S.table = World.compile(S.set.elements);
    S.world = S.world ? World.remap(S.world, S.table) : World.create(S.table);
    if (S.undo) S.undo = World.remap(S.undo, S.table);
    S.selected = keep && keep in S.table.index ? S.table.index[keep] : Math.min(1, S.set.elements.length);
    document.body.className = "theme-" + S.set.theme;
    S.bg = World.pack(BG[S.set.theme] || BG.night);
    $("title").textContent = S.set.title || "Falling Sand";
    document.title = S.set.title || "Falling Sand";
    const by = [...new Set(S.set.files.map((f) => f.by).filter(Boolean))];
    $("byline").textContent = by.length ? "Elements by " + joinAnd(by) : "";
    $("byline").hidden = !by.length;
    palette();
    showBadge();
  }

  function joinAnd(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }

  // ---------- the palette ----------

  function palette() {
    const box = $("palette");
    box.innerHTML = "";
    const add = (t, label, swatch, key) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.type = t;
      b.className = "el" + (t === S.selected ? " on" : "");
      b.setAttribute("aria-pressed", t === S.selected);
      b.innerHTML = `<i style="background:${swatch}"></i>${esc(label)}${key ? `<kbd>${key}</kbd>` : ""}`;
      b.onclick = () => pick(t);
      b.onmouseenter = b.onfocus = () => about(t);
      b.onmouseleave = b.onblur = () => about(S.selected);
      box.appendChild(b);
    };
    add(0, "eraser", "repeating-linear-gradient(45deg,#bbb 0 3px,#fff 3px 6px)", "E");
    S.set.elements.forEach((el, i) => add(i + 1, el.name, el.colors[0].text.replace(/\s+/g, ""), i < 9 ? String(i + 1) : ""));
    about(S.selected);
  }

  function pick(t) {
    if (t < 0 || t >= S.table.kinds.length) return;
    S.selected = t;
    for (const b of $("palette").children) {
      const on = +b.dataset.type === t;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    }
    about(t);
  }

  function about(t) {
    const p = $("about");
    if (t === 0) { p.innerHTML = "<strong>eraser</strong> Clears whatever you paint over."; return; }
    const el = S.set.elements[t - 1];
    if (!el) { p.textContent = ""; return; }
    p.innerHTML = `<strong>${esc(el.name)}</strong> <span class="from">elements/${esc(el.file)}, line ${el.line}</span> ` + Elements.describe(el).map(esc).join(" ");
  }

  // ---------- painting ----------

  function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(World.W - 1, Math.floor(((e.clientX - r.left) / r.width) * World.W))),
      y: Math.max(0, Math.min(World.H - 1, Math.floor(((e.clientY - r.top) / r.height) * World.H))),
    };
  }

  function paintLine(a, b) {
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (let s = 0; s <= steps; s++) {
      World.paint(S.world, Math.round(a.x + ((b.x - a.x) * s) / steps), Math.round(a.y + ((b.y - a.y) * s) / steps), BRUSH[S.brush], S.selected);
    }
  }

  function bindCanvas() {
    canvas.addEventListener("pointerdown", (e) => {
      if (!S.ready) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
      S.down = true;
      S.last = cellAt(e);
      paintLine(S.last, S.last);
    });
    canvas.addEventListener("pointermove", (e) => {
      const c = cellAt(e);
      S.hover = c;
      if (S.down && S.last) { paintLine(S.last, c); S.last = c; }
    });
    const up = () => { S.down = false; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", () => { S.hover = null; });
  }

  // ---------- running ----------

  let frames = 0, fpsSince = 0, tick = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!S.ready) return;
    frames++;
    if (now - fpsSince >= 1000) { S.fps = Math.round((frames * 1000) / (now - fpsSince)); frames = 0; fpsSince = now; }
    if (S.down && S.last) paintLine(S.last, S.last);
    if (S.running) {
      S.acc += S.speed;
      while (S.acc >= 1) { timedStep(); S.acc -= 1; }
    }
    World.draw(S.world, pixels, S.bg);
    ctx.putImageData(image, 0, 0);
    if (++tick % 12 === 0) status();
  }

  function timedStep() {
    const t0 = performance.now();
    World.step(S.world);
    S.stepMs = S.stepMs ? S.stepMs * 0.95 + (performance.now() - t0) * 0.05 : performance.now() - t0;
  }

  function status() {
    const n = World.counts(S.world);
    const filled = World.N - n[0];
    let under = "";
    if (S.hover) {
      const t = S.world.type[S.hover.y * World.W + S.hover.x];
      under = `Under the pointer: ${t ? S.table.kinds[t].name : "empty"} · `;
    }
    $("under").textContent = `${S.running ? "" : "Paused · "}${under}${filled.toLocaleString()} of ${World.N.toLocaleString()} cells filled · ${S.fps} fps`;
    const top = n.map((c, t) => [t, c]).filter(([t, c]) => t && c).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $("counts").textContent = top.map(([t, c]) => `${S.table.kinds[t].name} ${c.toLocaleString()}`).join(" · ");
  }

  function setRunning(on) {
    S.running = on;
    $("btn-pause").textContent = on ? "Pause" : "Play";
    $("btn-pause").setAttribute("aria-pressed", !on);
    status();
  }

  function stepOnce() {
    setRunning(false);
    timedStep();
    status();
  }

  function clear() {
    S.undo = S.world;
    S.world = World.create(S.table);
    notice(`Cleared the world. <button type="button" id="notice-undo">Undo</button>`);
    $("notice-undo").onclick = () => { if (S.undo) { S.world = S.undo; S.undo = null; } notice(""); };
  }

  function setBrush(b) {
    S.brush = b;
    for (const btn of document.querySelectorAll("[data-brush]")) btn.classList.toggle("on", +btn.dataset.brush === b);
  }

  // ---------- share links ----------

  function share() {
    const link = location.origin + location.pathname + "#" + World.encode(S.world);
    const chars = link.length - (location.origin + location.pathname).length - 1;
    const filled = World.N - World.counts(S.world)[0];
    const body = document.createElement("div");
    body.className = "share";
    body.innerHTML = `
      <p>Anyone who opens this link sees this world exactly as it is right now, and it starts running from there.</p>
      <div class="share-row"><input id="share-link" readonly value="${esc(link)}" aria-label="Share link"><button type="button" id="share-copy">Copy link</button></div>
      <p class="squeeze">This world has <b>${World.N.toLocaleString()}</b> cells (${filled.toLocaleString()} of them filled), but the link describes all of them in only <b>${chars.toLocaleString()}</b> characters.
      Instead of listing every cell, it counts <em>runs</em>: "4,212 empty, then 18 sand, then 3 water…". That trick is called <b>run-length encoding</b>, and it's one way computers make files smaller.
      Try it: share an empty world, then a messy one. Which link is longer, and why?</p>
      <p class="tip">Links remember elements by name. If your team renames an element later, old links show empty space where it was.</p>`;
    openPanel("Share this world", body);
    const input = body.querySelector("#share-link");
    input.focus();
    input.select();
    body.querySelector("#share-copy").onclick = async () => {
      try { await navigator.clipboard.writeText(link); body.querySelector("#share-copy").textContent = "Copied!"; }
      catch (e) { input.select(); document.execCommand && document.execCommand("copy"); body.querySelector("#share-copy").textContent = "Copied!"; }
    };
  }

  function fromLink() {
    if (!/w=/.test(location.hash)) return;
    const got = World.decode(location.hash, S.table);
    if (!got) {
      notice("This share link is broken or cut off, so the world starts empty. Try copying the whole link again.");
      return;
    }
    S.world = got.world;
    notice(`This world came from a share link.${got.unknown.length ? ` It used ${got.unknown.length === 1 ? "an element" : "elements"} this sandbox doesn't have (${esc(got.unknown.join(", "))}), shown as empty space.` : ""} <button type="button" id="notice-empty">Start with an empty world</button>`);
    $("notice-empty").onclick = () => { history.replaceState(null, "", location.pathname + location.search); S.world = World.create(S.table); notice(""); };
  }

  // ---------- testing a draft ----------

  function openDraft() {
    let saved = S.draft;
    if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(SAVE)); } catch (e) { saved = null; } }
    saved = saved || { as: "draft.txt", text: "" };
    const body = document.createElement("div");
    body.className = "draft-form";
    body.innerHTML = `
      <p>Paste an element file here to try it out. Nothing is saved to GitHub, and nobody else sees it.</p>
      <ol>
        <li>In GitHub, open your file and click the pencil to edit it. Select everything (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac) and copy it.</li>
        <li>Paste it below, choose which file it is, and click <strong>Try it</strong>.</li>
        <li>Paint with your new elements. When they work, go back to GitHub and commit.</li>
      </ol>
      <label>This draft is:
        <select id="draft-as"></select>
      </label>
      <textarea id="draft-text" spellcheck="false" placeholder="## goo&#10;color: limegreen&#10;moves: flows&#10;turns sand into goo (2%)"></textarea>
      <div class="draft-buttons"><button type="button" id="draft-try">Try it</button></div>`;
    const sel = body.querySelector("#draft-as");
    const opts = [["draft.txt", "a new file (an extra file, just for testing)"]]
      .concat(S.live.list.files.filter((f) => f.name !== "draft.txt").map((f) => [f.name, `my changes to ${f.name} (replaces it while testing)`]));
    for (const [v, label] of opts) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
    sel.value = opts.some(([v]) => v === saved.as) ? saved.as : "draft.txt";
    const text = body.querySelector("#draft-text");
    text.value = saved.text;
    body.querySelector("#draft-try").onclick = () => {
      const d = { as: sel.value, text: text.value };
      try { sessionStorage.setItem(SAVE, JSON.stringify(d)); } catch (e) { /* storage is off */ }
      testDraft(d);
    };
    if (S.draft) {
      const mine = problems().filter((p) => p.file === S.draft.as);
      const h = document.createElement("h3");
      h.textContent = mine.length ? "Problems in this draft" : "No problems in this draft";
      body.append(h, problemList(mine, true));
    }
    openPanel("Test a draft", body);
    text.focus();
  }

  function testDraft(d) {
    S.draft = d;
    const files = S.live.files.filter((f) => f.name !== d.as).concat([{ name: d.as, text: d.text }]);
    const entries = S.live.list.files.some((f) => f.name === d.as) ? S.live.list.files : S.live.list.files.concat([{ name: d.as, line: 0 }]);
    const order = entries.map((e) => e.name);
    files.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    rebuild({ list: Object.assign({}, S.live.list, { files: entries }), files });
    const first = S.set.elements.find((el) => el.file === d.as);
    if (first) pick(S.table.index[first.name]);
    closePanel();
    draftNotice();
  }

  function draftNotice() {
    const n = $("notice");
    n.className = "draft";
    n.innerHTML = `<strong>Testing a draft</strong> of ${esc(S.draft.as)}. Nothing is saved, and nobody else sees it.
      <button type="button" id="notice-edit">Edit the draft</button> <button type="button" id="notice-stop">Stop testing</button>`;
    n.hidden = false;
    $("notice-edit").onclick = openDraft;
    $("notice-stop").onclick = stopDraft;
  }

  function stopDraft() {
    S.draft = null;
    $("notice").className = "";
    notice("");
    rebuild(S.live);
  }

  // ---------- problems ----------

  function problems() {
    return S.set.problems;
  }

  function showBadge() {
    const all = problems();
    const errors = all.filter((p) => p.level === "error").length;
    const btn = $("btn-problems");
    btn.className = errors ? "bad" : all.length ? "warn" : "good";
    btn.textContent = all.length ? `⚠ ${all.length} problem${all.length === 1 ? "" : "s"}` : "✓ No problems";
  }

  function problemList(list, draftOnly) {
    const wrap = document.createElement("div");
    if (!list.length) {
      if (!draftOnly) wrap.innerHTML = "<p class='all-good'>✓ No problems. Every element file loaded, and every rule makes sense.</p>";
      return wrap;
    }
    const intro = document.createElement("p");
    intro.textContent = "Red problems mean part of a file is being skipped. Yellow ones are probably mistakes. Fix the first one and test again: later problems are sometimes caused by earlier ones.";
    wrap.appendChild(intro);
    for (const p of list) {
      const card = document.createElement("div");
      card.className = "problem " + p.level;
      card.innerHTML = `<div class="where">elements/${esc(p.file)}${p.line ? ", line " + p.line : ""}</div>
        <div class="what">${esc(p.message)}</div>${p.fix ? `<div class="fix">${esc(p.fix)}</div>` : ""}`;
      wrap.appendChild(card);
    }
    return wrap;
  }

  // ---------- panels and notices ----------

  function openPanel(title, body) {
    $("panel-title").textContent = title;
    const b = $("panel-body");
    b.innerHTML = "";
    b.appendChild(body);
    $("panel").hidden = false;
    if (!body.querySelector("input, textarea")) $("panel-close").focus();
  }

  function closePanel() { $("panel").hidden = true; }

  function notice(html) {
    const n = $("notice");
    if (S.draft && !html) { draftNotice(); return; }
    n.className = "";
    n.innerHTML = html;
    n.hidden = !html;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- start ----------

  function bind() {
    $("btn-pause").onclick = () => setRunning(!S.running);
    $("btn-step").onclick = stepOnce;
    $("btn-clear").onclick = clear;
    $("speed").onchange = (e) => { S.speed = +e.target.value; S.acc = 0; };
    for (const b of document.querySelectorAll("[data-brush]")) b.onclick = () => setBrush(+b.dataset.brush);
    $("btn-share").onclick = share;
    $("btn-draft").onclick = openDraft;
    $("btn-problems").onclick = () => openPanel("Problems", problemList(problems()));
    $("panel-close").onclick = closePanel;
    $("panel").onclick = (e) => { if (e.target.id === "panel") closePanel(); };
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") return closePanel();
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!$("panel").hidden || !S.ready) return;
      if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); setRunning(!S.running); }
      else if (e.key === "n" || e.key === "N") stepOnce();
      else if (e.key === "e" || e.key === "E") pick(0);
      else if (e.key === "b" || e.key === "B") setBrush((S.brush + 1) % BRUSH.length);
      else if (/^[1-9]$/.test(e.key)) pick(+e.key);
    });
    bindCanvas();
  }

  async function start() {
    bind();
    setBrush(1);
    if (location.protocol === "file:") {
      $("title").textContent = "Open this from your live link";
      $("stage").innerHTML = "<p class='offline'>This project reads its element files from a web server, so double-clicking <code>index.html</code> won't work. Use your live link: <code>https://YOUR-USERNAME.github.io/falling-sand/</code></p>";
      return;
    }
    S.live = await load();
    rebuild(S.live);
    fromLink();
    S.ready = true;
    status();
    requestAnimationFrame((t) => { fpsSince = t; frame(t); });
  }

  return { start, state: S, pick, testDraft, stopDraft, problems, share, step: stepOnce, setRunning };
})();

window.addEventListener("load", App.start);
