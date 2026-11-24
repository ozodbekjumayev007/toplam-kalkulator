(function (g) {
'use strict';
const NUM = /^[+-]?(\d+\.?\d*|\.\d+)$/;
function canon(x) {
  const m = /^([+-]?)(\d*)\.?(\d*)$/.exec(x);
  let s = m[1] === '-' ? '-' : '';
  const i = m[2].replace(/^0+/, '') || '0', f = m[3].replace(/0+$/, '');
  if (i === '0' && !f) s = '';
  return s + i + (f ? '.' + f : '');
}
function norm(x, o) {
  x = x.trim().normalize('NFC');
  if (!o.caseSens) x = x.toLowerCase();
  if (o.numeric && NUM.test(x)) x = canon(x);
  return x;
}
function parseList(t, o) {
  const toks = [];
  let cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',' || c === '\n' || c === '\r') { toks.push(cur); cur = ''; }
    else cur += c;
  }
  toks.push(cur);
  const map = new Map(), merged = [];
  let dups = 0;
  for (let v of toks) {
    v = v.trim();
    if (!v) continue;
    const k = norm(v, o);
    if (map.has(k)) { dups++; if (map.get(k) !== v) merged.push(map.get(k) + ' = ' + v); }
    else map.set(k, v);
  }
  return { map, dups, merged };
}
const OPS = {
  '∪': b => b.some(Boolean),
  '∩': b => b.every(Boolean),
  '\\': b => !!b[0] && !b.slice(1).some(Boolean),
  'Δ': b => b.filter(Boolean).length % 2 === 1
};
const direct = {
  '∪': a => { const r = new Map(); a.forEach(s => s.forEach((d, k) => r.has(k) || r.set(k, d))); return r; },
  '∩': a => { const r = new Map(); a[0].forEach((d, k) => a.every(s => s.has(k)) && r.set(k, d)); return r; },
  '\\': a => { const r = new Map(a[0]); a.slice(1).forEach(s => s.forEach((d, k) => r.delete(k))); return r; },
  'Δ': a => a.reduce((x, y) => {
    const r = new Map();
    x.forEach((d, k) => y.has(k) || r.set(k, d));
    y.forEach((d, k) => x.has(k) || r.set(k, d));
    return r;
  })
};
function evalPred(sets, pred) {
  const out = new Map(), seen = new Set();
  for (const s of sets) for (const [k, d] of s) {
    if (seen.has(k)) continue;
    seen.add(k);
    if (pred(sets.map(x => x.has(k)))) out.set(k, d);
  }
  return out;
}
const sub = (a, b) => { for (const k of a.keys()) if (!b.has(k)) return false; return true; };
const same = (a, b) => a.size === b.size && sub(a, b);
const cart = (a, b) => { const r = []; a.forEach(x => b.forEach(y => r.push([x, y]))); return r; };

function parseExpr(src, names) {
  const T = [];
  for (const c of src) {
    if (/\s/.test(c)) continue;
    if (/[A-Z]/.test(c)) { if (!names.includes(c)) throw new Error('"' + c + '" to\'plami yo\'q'); T.push({ t: 'S', v: c }); }
    else if ('∪∩\\Δ'.includes(c)) T.push({ t: 'O', v: c });
    else if (c === '(' || c === ')') T.push({ t: c });
    else throw new Error("Noma'lum belgi: " + c);
  }
  if (!T.length) throw new Error("Ifoda bo'sh");
  let p = 0;
  const operand = () => {
    const t = T[p];
    if (!t) throw new Error('Ifoda tugallanmagan: operand kerak');
    if (t.t === 'S') { p++; return { n: { s: t.v }, s: t.v }; }
    if (t.t === '(') {
      p++;
      const r = chain();
      if (!T[p] || T[p].t !== ')') throw new Error('Yopuvchi qavs yetishmaydi');
      p++;
      return { n: r.n, s: '(' + r.s + ')' };
    }
    throw new Error(t.t === 'O' ? '"' + t.v + '" dan oldin to\'plam kerak' : "Bo'sh qavs yoki ortiqcha ')'");
  };
  function chain() {
    const od = [], ops = [];
    for (;;) { od.push(operand()); if (T[p] && T[p].t === 'O') ops.push(T[p++].v); else break; }
    const n = od.length - 1, txt = od.map(o => o.s);
    const j = (a, b) => { let s = txt[a]; for (let k = a + 1; k <= b; k++) s += ' ' + ops[k - 1] + ' ' + txt[k]; return s; };
    const i = ops.findIndex(x => x !== ops[0]);
    if (i > 0) {
      let t1 = '';
      for (let q = i + 1; q <= n; q++) t1 += ' ' + ops[q - 1] + ' ' + txt[q];
      const e = new Error('Aralash amallar uchun qavs kerak');
      e.fix = ['(' + j(0, i) + ')' + t1, j(0, i - 1) + ' ' + ops[i - 1] + ' (' + j(i, n) + ')'];
      throw e;
    }
    return { n: n ? { op: ops[0], args: od.map(o => o.n) } : od[0].n, s: j(0, n) };
  }
  const r = chain();
  if (p < T.length) throw new Error(T[p].t === ')' ? "Ortiqcha ')'" : "Ikki to'plam orasida amal belgisi kerak");
  return r.n;
}
function letters(n, s) { s = s || new Set(); if (n.s) s.add(n.s); else n.args.forEach(a => letters(a, s)); return s; }
const predAst = (n, e) => n.s ? e[n.s] : OPS[n.op](n.args.map(a => predAst(a, e)));
const setAst = (n, e) => n.s ? e[n.s] : direct[n.op](n.args.map(a => setAst(a, e)));

const API = { canon, norm, parseList, OPS, direct, evalPred, sub, same, cart, parseExpr, letters, predAst, setAst };
g.SetsLib = API;
if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);