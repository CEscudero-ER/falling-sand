/* Engine: the world. A grid of 200 × 150 cells. Every frame, each cell that
   isn't empty checks its element's rules: maybe it runs out, maybe it reacts
   with a neighbor, maybe it moves one step. That's the whole simulation.
   You don't need to edit this file. */

const World = (() => {
  const W = 200, H = 150, N = W * H;
  const MOVE = { stays: 0, falls: 1, flows: 2, rises: 3 };
  const NEAR = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

  // Turn the checked elements into fast lookup tables. Cell type 0 is empty;
  // elements are numbered from 1 in palette order.
  function compile(elements) {
    const index = { empty: 0 };
    elements.forEach((el, i) => { index[el.name] = i + 1; });
    const kinds = [{ name: "empty", move: -1, weight: 0, colors: new Uint32Array([0]) }];
    for (const el of elements) {
      const colors = [];
      for (const c of el.colors) for (const k of [1, 1.08, 0.92]) colors.push(pack(c.rgb, k));
      kinds.push({
        name: el.name,
        move: MOVE[el.moves],
        weight: el.weight,
        colors: new Uint32Array(colors),
        shimmer: el.moves === "rises",
        lasts: el.lasts ? [el.lasts[0], el.lasts[1]] : null,
        then: el.then ? index[el.then.name] : 0,
        becomes: el.becomes.map((r) => ({ to: index[r.to], touching: index[r.touching], chance: r.chance / 100 })),
        turns: el.turns.map((r) => ({ from: index[r.from], to: index[r.to], chance: r.chance / 100 })),
      });
    }
    return { kinds, index };
  }

  // Colors go into the canvas as one number each: alpha, blue, green, red.
  function pack([r, g, b], k = 1) {
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return ((255 << 24) | (f(b) << 16) | (f(g) << 8) | f(r)) >>> 0;
  }

  function create(table) {
    return {
      table, tick: 1, frames: 0,
      type: new Uint8Array(N), shade: new Uint8Array(N), life: new Uint16Array(N), stamp: new Uint8Array(N),
    };
  }

  const rand = (n) => (Math.random() * n) | 0;

  function set(w, i, t) {
    const k = w.table.kinds[t];
    w.type[i] = t;
    w.shade[i] = rand(k.colors.length);
    w.life[i] = k.lasts ? k.lasts[0] + rand(k.lasts[1] - k.lasts[0] + 1) : 0;
    w.stamp[i] = w.tick;
  }

  function swap(w, i, j) {
    const { type, shade, life, stamp } = w;
    let t = type[i]; type[i] = type[j]; type[j] = t;
    t = shade[i]; shade[i] = shade[j]; shade[j] = t;
    t = life[i]; life[i] = life[j]; life[j] = t;
    stamp[i] = stamp[j] = w.tick;
  }

  // Can the thing at i move to (x, y)? Into empty space, yes. Down into
  // something lighter that moves, or up into something heavier that moves, yes.
  function canMove(w, i, x, y, dy) {
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    const j = y * W + x;
    const t = w.type[j];
    if (t === 0) return true;
    if (dy === 0) return false;
    const me = w.table.kinds[w.type[i]], it = w.table.kinds[t];
    if (it.move === 0) return false;
    return dy > 0 ? me.weight > it.weight : me.weight < it.weight;
  }

  function touching(w, x, y, t) {
    for (const [dx, dy] of NEAR) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (w.type[ny * W + nx] === t) return true;
    }
    return false;
  }

  function step(w) {
    w.tick = w.tick === 255 ? 1 : w.tick + 1;
    w.frames++;
    const { type, life, stamp } = w, kinds = w.table.kinds, tick = w.tick;
    for (let y = H - 1; y >= 0; y--) {
      const leftToRight = ((y + w.frames) & 1) === 0;
      for (let k = 0; k < W; k++) {
        const x = leftToRight ? k : W - 1 - k;
        const i = y * W + x;
        const t = type[i];
        if (t === 0 || stamp[i] === tick) continue;
        const e = kinds[t];

        // 1. Running out.
        if (e.lasts) {
          if (life[i] === 0) life[i] = e.lasts[0] + rand(e.lasts[1] - e.lasts[0] + 1);
          else if (--life[i] === 0) { set(w, i, e.then); continue; }
        }

        // 2. Changing itself because of what it touches.
        let changed = false;
        for (const r of e.becomes) {
          if (Math.random() < r.chance && touching(w, x, y, r.touching)) { set(w, i, r.to); changed = true; break; }
        }
        if (changed) continue;

        // 3. Changing what it touches.
        for (const r of e.turns) {
          for (const [dx, dy] of NEAR) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const j = ny * W + nx;
            if (type[j] === r.from && Math.random() < r.chance) set(w, j, r.to);
          }
        }

        // 4. Moving. (Only things that actually move get marked as done for
        // this frame, so something heavy can still sink through them.)
        if (e.move === 0) continue;
        const side = Math.random() < 0.5 ? -1 : 1;
        if (e.move === 1 || e.move === 2) {
          if (canMove(w, i, x, y + 1, 1)) { swap(w, i, i + W); continue; }
          if (canMove(w, i, x + side, y + 1, 1)) { swap(w, i, i + W + side); continue; }
          if (canMove(w, i, x - side, y + 1, 1)) { swap(w, i, i + W - side); continue; }
          if (e.move === 2) flow(w, i, x, y, side);
        } else {
          const r = Math.random();
          const dx = r < 0.6 ? 0 : r < 0.8 ? -1 : 1;
          if (canMove(w, i, x + dx, y - 1, -1)) { swap(w, i, i - W + dx); continue; }
          if (canMove(w, i, x + side, y - 1, -1)) { swap(w, i, i - W + side); continue; }
          if (canMove(w, i, x + side, y, 0) && Math.random() < 0.7) swap(w, i, i + side);
        }
      }
    }
  }

  // Liquids slide sideways up to 3 cells, so puddles level out quickly. A
  // heavier liquid can also push sideways under a lighter one, so liquids
  // sort themselves into layers (oil ends up on top of water).
  function flow(w, i, x, y, side) {
    for (const d of [side, -side]) {
      let go = 0;
      for (let s = 1; s <= 3; s++) {
        if (!canMove(w, i, x + d * s, y, 0)) break;
        go = s;
        if (canMove(w, i, x + d * s, y + 1, 1)) break;
      }
      if (go) { swap(w, i, i + d * go); return; }
    }
    const nx = x + side;
    if (nx < 0 || nx >= W) return;
    const it = w.table.kinds[w.type[i + side]];
    if (it.move === 2 && it.weight < w.table.kinds[w.type[i]].weight) swap(w, i, i + side);
  }

  // Paint a round brush. Empty cells fill up; the eraser (type 0) clears.
  // Things that move go on a little patchy, so they look like grains.
  function paint(w, cx, cy, radius, t) {
    const k = w.table.kinds[t];
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > radius * radius + radius) continue;
        const i = y * W + x;
        if (t === 0) { w.type[i] = 0; continue; }
        if (w.type[i] !== 0) continue;
        if (radius > 0 && k.move !== 0 && Math.random() < 0.4) continue;
        set(w, i, t);
      }
    }
  }

  function draw(w, pixels, background) {
    const { type, shade } = w, kinds = w.table.kinds;
    for (let i = 0; i < N; i++) {
      const t = type[i];
      if (t === 0) { pixels[i] = background; continue; }
      const c = kinds[t].colors;
      pixels[i] = kinds[t].shimmer ? c[rand(c.length)] : c[shade[i] % c.length];
    }
  }

  function counts(w) {
    const n = new Array(w.table.kinds.length).fill(0);
    for (let i = 0; i < N; i++) n[w.type[i]]++;
    return n;
  }

  // Move a world to a new set of elements, matching them up by name.
  function remap(w, table) {
    const map = w.table.kinds.map((k) => (k.name in table.index ? table.index[k.name] : 0));
    const next = create(table);
    for (let i = 0; i < N; i++) {
      const t = map[w.type[i]];
      if (t) { next.type[i] = t; next.shade[i] = w.shade[i] % table.kinds[t].colors.length; next.life[i] = w.life[i]; }
    }
    next.frames = w.frames;
    return next;
  }

  // ---------- share links ----------
  // The link lists the element names used, then the cells as runs:
  // "3,412 empty, then 12 sand, then 1 water, ..." That's run-length encoding.

  function encode(w) {
    const used = [0];
    const slot = new Map([[0, 0]]);
    const bytes = [];
    const push = (v) => { while (v >= 128) { bytes.push((v & 127) | 128); v >>>= 7; } bytes.push(v); };
    for (let i = 0; i < N;) {
      const t = w.type[i];
      let run = 1;
      while (i + run < N && w.type[i + run] === t) run++;
      if (!slot.has(t)) { slot.set(t, used.length); used.push(t); }
      push(slot.get(t));
      push(run);
      i += run;
    }
    const names = used.slice(1).map((t) => w.table.kinds[t].name).join("~");
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const data = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `w=1.${W}.${H}.${names}.${data}`;
  }

  // Returns { world, unknown: [names this sandbox doesn't have] } or null.
  function decode(hash, table) {
    const m = /(?:^|[#&])w=1\.(\d+)\.(\d+)\.([a-z0-9~-]*)\.([A-Za-z0-9_-]*)/.exec(hash);
    if (!m || +m[1] !== W || +m[2] !== H) return null;
    const names = m[3] ? m[3].split("~") : [];
    const types = [0].concat(names.map((n) => (n in table.index ? table.index[n] : 0)));
    const unknown = names.filter((n) => !(n in table.index));
    let bin;
    try { bin = atob(m[4].replace(/-/g, "+").replace(/_/g, "/")); } catch (e) { return null; }
    const w = create(table);
    let p = 0, i = 0;
    const read = () => {
      let v = 0, shift = 0, b;
      do { if (p >= bin.length) return -1; b = bin.charCodeAt(p++); v |= (b & 127) << shift; shift += 7; } while (b & 128);
      return v;
    };
    while (i < N) {
      const s = read(), run = read();
      if (s < 0 || run <= 0 || s >= types.length) return null;
      const t = types[s];
      for (let k = 0; k < run && i < N; k++, i++) if (t) set(w, i, t);
    }
    w.tick = 1;
    w.stamp.fill(0);
    return { world: w, unknown };
  }

  return { W, H, N, compile, create, step, paint, draw, counts, remap, encode, decode, pack };
})();

if (typeof module !== "undefined") module.exports = World;
