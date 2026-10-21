// captions.js: word-by-word captions synced to a narration from tools/tts.py.
//
// captions(t, nar, o) shows the phrase being spoken at time t and highlights the word being said right now. Call it
// last in a shot, in screen space (after camEnd()), with t in the narration's time (shift it if the voice starts late).
//   nar: NARRATION.<name>, or any { words: [{ w, t0, t1 }] }
//   o:   y (centre of the block, default inside SAFE's lower half), size (px), font (a loaded font family),
//        maxW (line width), lines (max lines per phrase), maxWords (per phrase),
//        col (spoken words), hi (the word being said), future ('dim' | 'hide' | 'show': words not said yet),
//        upper (Turkish-aware upper case), stroke (outline colour), shake (px of tremble on the current word)
// A phrase ends at a sentence end, at a pause in the voice, or when it's full; it stays up until the next one starts,
// or through a long pause for `hold` seconds after its last word.
const NARRATION = {};
const CAPTION_FONT = 'Anton';   // has the Turkish letters (ğ ş ı İ); Permanent Marker doesn't

// The time (s) the n-th word starting with `txt` is said: sync the animation to the voice, e.g. wordT(nar, 'aralandı').
function wordT(nar, txt, n = 0) {
  const low = s => s.toLocaleLowerCase('tr-TR'), hits = nar.words.filter(w => low(w.w).replace(/^[^\p{L}\d]+/u, '').startsWith(low(txt)));
  if (!hits[n]) throw new Error(`wordT: "${txt}" (#${n}) isn't in the narration`);
  return hits[n].t0;
}

function captionPages(nar, o) {
  const key = JSON.stringify([o.size, o.font, o.maxW, o.lines, o.maxWords, o.upper, o.hold]);
  if (nar._pages && nar._pages.key === key) return nar._pages.list;   // derived from the words alone: same every frame
  const c = letG.drawingContext; c.font = `${o.size}px "${o.font}"`;
  const space = c.measureText(' ').width + o.size * .1,   // room for the said word to grow into
    words = nar.words.map(w => ({ ...w, txt: o.upper ? w.w.toLocaleUpperCase('tr-TR') : w.w }));
  for (const w of words) w.wd = c.measureText(w.txt).width;
  const pages = []; let page = null;
  words.forEach((w, i) => {
    const prev = words[i - 1], breakBefore = !page || /[.!?…]["'”’»)]*$/.test(prev.w) || w.t0 - prev.t1 > .35 || page.words.length >= o.maxWords;
    let line = page && page.lines[page.lines.length - 1];
    if (!breakBefore && line.w + space + w.wd > o.maxW) {
      if (page.lines.length < o.lines) { line = { w: -space, words: [] }; page.lines.push(line); } else line = null;
    }
    if (breakBefore || !line) { page = { words: [], lines: [{ w: -space, words: [] }] }; pages.push(page); line = page.lines[0]; }
    line.words.push(w); line.w += space + w.wd; page.words.push(w);
  });
  pages.forEach((p, i) => {
    const last = p.words[p.words.length - 1], next = pages[i + 1];
    p.t0 = p.words[0].t0; p.t1 = next && next.t0 - last.t1 < o.hold ? next.t0 : last.t1 + o.hold;
    p.words.forEach((w, j) => w.end = j + 1 < p.words.length ? p.words[j + 1].t0 : p.t1);   // highlight until the next word
  });
  nar._pages = { key, list: pages, space };
  return pages;
}

function captions(t, nar, o = {}) {
  o = { size: 92, font: CAPTION_FONT, maxW: SAFE.w - 60, lines: 2, maxWords: 4, col: PAL.cream, hi: '#E8453C', future: 'dim',
        upper: true, stroke: PAL.ink, shake: 0, hold: .45, lead: .06, y: lerp(SAFE.y0, SAFE.y1, .62), x: SAFE.cx, ...o };
  const pages = captionPages(nar, o), p = pages.find(p => t >= p.t0 - o.lead && t < p.t1);
  if (!p) return;
  const lh = o.size * 1.12, y0 = o.y - (p.lines.length - 1) * lh / 2, space = nar._pages.space;
  p.lines.forEach((line, li) => {
    let x = o.x - line.w / 2;
    for (const w of line.words) {
      const cx = x + w.wd / 2, now = t >= w.t0 && t < w.end, said = t >= w.t0;
      x += w.wd + space;
      if (!said && o.future === 'hide') continue;
      boilSeed('cap' + w.t0);
      const age = t - w.t0, pop = now ? 1 + .1 * Math.exp(-age * 9) + .04 : 1;   // a kick as it's said, then held a bit bigger
      const sh = now && o.shake ? [jit(o.shake), jit(o.shake)] : [0, 0];
      letter(w.txt, cx + sh[0], y0 + li * lh + sh[1], o.size * pop, now ? o.hi : o.col, {
        font: `${o.size * pop}px "${o.font}"`, stroke: o.stroke, rot: jit(.012),
        alpha: said || o.future === 'show' ? 1 : .38, pop: o.future === 'hide' ? age * 7 : null });
    }
  });
}
