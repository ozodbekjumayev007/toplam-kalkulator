(() => {
'use strict';
const L = SetsLib, $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAL = [['#EEEDFE', '#7F77DD', '#3C3489'], ['#E1F5EE', '#1D9E75', '#085041'], ['#FAECE7', '#D85A30', '#712B13'], ['#FBEAF0', '#D4537E', '#72243E'],
  ['#FAEEDA', '#BA7517', '#633806'], ['#EAF3DE', '#639922', '#27500A'], ['#FCEBEB', '#E24B4A', '#791F1F'], ['#F1EFE8', '#888780', '#444441']];
const col = n => PAL[(n.charCodeAt(0) - 65) % 8];
const S = { sets: [], pick: new Set(), op: '∩', extra: null, mode: 'oddiy', expr: '', go: false, o: { caseSens: true, numeric: false }, cur: null };
const OPN = [['∪', 'Birlashma', "Hammasini bir joyga yig'ish"], ['∩', 'Kesishma', 'Hammasida ham bor'], ['\\', 'Ayirma', "Birinchisida bor, qolganlarida yo'q"], ['Δ', 'Simmetrik ayirma', 'Faqat bittasida bor']];
const XTR = [['sub', "Qism to'plam ⊆"], ['eq', 'Tenglik ='], ['disj', 'Kesishmaslik'], ['card', 'Quvvat |A|'], ['cart', "Dekart ko'paytma ×"]];
const B0 = '<circle cx="13" cy="12" r="9" fill="none" stroke="#2F6FDE"/><circle cx="23" cy="12" r="9" fill="none" stroke="#2F6FDE"/>', F = 'fill="#2F6FDE" fill-opacity=".65"';
const ICON = {
  '∪': `<circle cx="13" cy="12" r="9" ${F} stroke="#2F6FDE"/><circle cx="23" cy="12" r="9" ${F} stroke="#2F6FDE"/>`,
  '∩': B0 + `<clipPath id="ci"><circle cx="23" cy="12" r="9"/></clipPath><circle cx="13" cy="12" r="9" ${F} clip-path="url(#ci)"/>`,
  '\\': B0 + `<mask id="mi"><rect width="36" height="24" fill="#fff"/><circle cx="23" cy="12" r="9"/></mask><circle cx="13" cy="12" r="9" ${F} mask="url(#mi)"/>`,
  'Δ': B0 + `<mask id="ma"><rect width="36" height="24" fill="#fff"/><circle cx="13" cy="12" r="9"/></mask><mask id="mb"><rect width="36" height="24" fill="#fff"/><circle cx="23" cy="12" r="9"/></mask><circle cx="13" cy="12" r="9" ${F} mask="url(#mb)"/><circle cx="23" cy="12" r="9" ${F} mask="url(#ma)"/>`
};
const mp = n => S.sets.find(s => s.name === n).map;
const names = () => S.sets.map(s => s.name).filter(n => S.pick.has(n)).sort();
const J = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' va ' + a[a.length - 1];
const fmt = d => /[,"\n]/.test(d) ? '"' + d.replace(/"/g, '""') + '"' : d;

function parse(s) { const r = L.parseList(s.text, S.o); s.map = r.map; s.dups = r.dups; s.mer = r.merged; }
function note(s) {
  const e = $('#n' + s.name); if (!e) return;
  let t = s.dups ? s.dups + ' ta takror bir marta sanaldi' : '';
  if (s.mer.length) t += (t ? '. ' : '') + 'Bir xil deb olindi: ' + s.mer.slice(0, 3).join(', ');
  e.textContent = t;
}
function addSet(text) {
  let n = ''; for (let i = 0; i < 26; i++) { const c = String.fromCharCode(65 + i); if (!S.sets.some(s => s.name === c)) { n = c; break; } }
  if (!n) return null;
  const s = { name: n, text: text || '' }; parse(s); S.sets.push(s); S.sets.sort((a, b) => a.name < b.name ? -1 : 1); return n;
}
function rows() {
  $('#sets').innerHTML = S.sets.map(s => { const c = col(s.name); return `<div class="row"><span class="av" style="background:${c[0]};border-color:${c[1]};color:${c[2]}">${s.name}</span><div class="fld"><input data-n="${s.name}" value="${esc(s.text)}" placeholder="1, 2, 3, a, b" aria-label="${s.name} to'plam elementlari"><small id="n${s.name}"></small></div><button class="x" data-del="${s.name}" aria-label="${s.name} to'plamini o'chirish">×</button></div>`; }).join('');
  S.sets.forEach(note); $('#addSet').disabled = S.sets.length >= 26;
}
function ctl() {
  $('#ops').innerHTML = OPN.map(([k, n, h]) => `<button class="op${S.op === k && !S.extra ? ' sel' : ''}" data-op="${esc(k)}"><svg width="36" height="24" viewBox="0 0 36 24" aria-hidden="true">${ICON[k]}</svg><b>${n}<em>${k}</em></b><small>${h}</small></button>`).join('');
  $('#pick').innerHTML = S.sets.map(s => { const c = col(s.name), on = S.pick.has(s.name); return `<button class="pick" data-pick="${s.name}" aria-pressed="${on}" style="${on ? `background:${c[0]};border-color:${c[1]};color:${c[2]}` : ''}">${on ? '✓ ' : ''}${s.name}</button>`; }).join('');
  $('#extra').innerHTML = XTR.map(([k, n]) => `<button class="btn sm${S.extra === k ? ' on' : ''}" data-x="${k}">${n}</button>`).join('');
  $('#ksets').innerHTML = S.sets.map(s => { const c = col(s.name); return `<button class="key" data-k="${s.name}" style="background:${c[0]};border-color:${c[1]};color:${c[2]};font-weight:600">${s.name}</button>`; }).join('');
}

function calcOp() {
  const nm = names(); if (nm.length < 2) return { err: "Kamida 2 ta to'plamni belgilang" };
  const ms = nm.map(mp), o = S.op, r = L.evalPred(ms, L.OPS[o]), d = L.direct[o](ms), title = nm.join(' ' + o + ' ');
  const first = nm[0], rest = J(nm.slice(1));
  const say = { '∪': `${J(nm)} ning birortasida bor elementlar`, '∩': `${J(nm)} ning hammasida ham bor elementlar`, '\\': `${first} da bor, lekin ${rest} da yo'q elementlar`,
    'Δ': nm.length === 2 ? `${J(nm)} ning faqat bittasida bor elementlar` : "Toq sondagi to'plamda (1, 3, ...) uchraydigan elementlar" }[o];
  let ok = L.same(r, d), text = 'Ikki usulda hisoblandi, natija mos';
  if (nm.length === 2) {
    const a = ms[0].size, b = ms[1].size, i = L.direct['∩'](ms).size, u = L.direct['∪'](ms).size;
    const f = { '∪': [`|A| + |B| − |A ∩ B|`, `${a} + ${b} − ${i}`, a + b - i], '∩': [`|A| + |B| − |A ∪ B|`, `${a} + ${b} − ${u}`, a + b - u],
      '\\': [`|A| − |A ∩ B|`, `${a} − ${i}`, a - i], 'Δ': [`|A| + |B| − 2·|A ∩ B|`, `${a} + ${b} − 2·${i}`, a + b - 2 * i] }[o];
    ok = ok && f[2] === r.size; text = `|${title}| = ${f[0].replace('|A|', '|' + nm[0] + '|').replace('|B|', '|' + nm[1] + '|').replace(/A ([∩∪]) B/, nm[0] + ' $1 ' + nm[1])} → ${f[1]} = ${f[2]}`;
  }
  return { title, say, sub: o === '\\' && nm.length > 2 ? `Chapdan o'ngga: ${nm.slice(1).reduce((x, y) => `(${x} \\ ${y})`, first)}` : '', map: r, venn: { nm, pred: L.OPS[o] }, chk: { ok, text } };
}
function calcExpr() {
  let ast; try { ast = L.parseExpr(S.expr, S.sets.map(s => s.name)); } catch (e) { return { err: e.message, fix: e.fix }; }
  const nm = [...L.letters(ast)].sort(), ms = nm.map(mp), env = b => Object.fromEntries(nm.map((n, i) => [n, b[i]]));
  const pred = b => L.predAst(ast, env(b)), r = L.evalPred(ms, pred), d = L.setAst(ast, Object.fromEntries(nm.map((n, i) => [n, ms[i]])));
  const title = S.expr.replace(/\s+/g, '').replace(/([∪∩\\Δ])/g, ' $1 ');
  return { title, say: 'Ifoda hisoblandi', sub: '', map: r, venn: { nm, pred }, chk: { ok: L.same(r, d), text: 'Ikki usulda hisoblandi, natija mos' } };
}
function calcX() {
  const nm = names(), k = S.extra;
  if (k === 'card') { if (!nm.length) return { err: "Kamida 1 ta to'plamni belgilang" }; return { say: "To'plamlar quvvati (elementlar soni)", lines: nm.map(n => `|${n}| = ${mp(n).size}`), venn: { nm, pred: null } }; }
  if (nm.length !== 2) return { err: 'Bu amal uchun aynan 2 ta to\'plamni belgilang' };
  const [a, b] = nm, A = mp(a), B = mp(b), yn = v => v ? 'ha' : "yo'q", v = { nm, pred: null };
  if (k === 'sub') { const ab = L.sub(A, B), ba = L.sub(B, A); return { say: `${a} ⊆ ${b}: ${yn(ab)}`, lines: [`${a} ⊂ ${b} (qat'iy qism): ${yn(ab && A.size < B.size)}`, `${b} ⊆ ${a}: ${yn(ba)}`, `${b} ⊂ ${a} (qat'iy qism): ${yn(ba && B.size < A.size)}`], venn: v }; }
  if (k === 'eq') return { say: `${a} = ${b}: ${yn(L.same(A, B))}`, lines: [`${a} da ${A.size} ta, ${b} da ${B.size} ta element bor`], venn: v };
  if (k === 'disj') { const c = L.direct['∩']([A, B]).size; return { say: `${a} va ${b} kesishmaydi: ${yn(c === 0)}`, lines: [`Umumiy elementlar soni: ${c}`], venn: v }; }
  const n = A.size * B.size, pairs = n <= 5000 ? L.cart(A, B) : null;
  return { say: `${a} × ${b}: ${n} ta tartiblangan juftlik`, pairs, big: !pairs, chk: { ok: !pairs || pairs.length === n, text: `|${a} × ${b}| = |${a}|·|${b}| → ${A.size}·${B.size} = ${n}` } };
}

function venn(nm, pred) {
  const n = nm.length, G = n === 3 ? [[125, 90], [215, 90], [170, 155]] : [[120, 110], [220, 110]], R = n === 3 ? 65 : 75;
  const POS = { 3: { 1: [88, 72], 2: [252, 72], 3: [170, 64], 4: [170, 205], 5: [128, 138], 6: [212, 138], 7: [170, 112] }, 2: { 1: [80, 112], 2: [260, 112], 3: [170, 112] } };
  const LAB = n === 3 ? [[46, 30], [292, 30], [270, 214]] : [[44, 36], [296, 36]];
  const ms = nm.map(mp), U = new Map(); ms.forEach(m => m.forEach((d, k) => U.has(k) || U.set(k, d)));
  const reg = {}; for (const k of U.keys()) { let m = 0; ms.forEach((x, i) => x.has(k) && (m |= 1 << i)); (reg[m] = reg[m] || []).push(U.get(k)); }
  let defs = '', hl = '', txt = '', tot = 0; const full = (1 << n) - 1;
  G.forEach(([x, y], i) => defs += `<clipPath id="c${i}"><circle cx="${x}" cy="${y}" r="${R}"/></clipPath>`);
  for (let m = 1; m <= full; m++) {
    const els = reg[m] || []; tot += els.length;
    const on = !!pred && pred(nm.map((_, i) => !!(m >> i & 1)));
    if (on) {
      defs += `<mask id="m${m}"><rect width="340" height="235" fill="#fff"/>${G.map(([x, y], i) => m >> i & 1 ? '' : `<circle cx="${x}" cy="${y}" r="${R}"/>`).join('')}</mask>`;
      let g = '<rect width="340" height="235" fill="#2F6FDE" fill-opacity=".42"/>';
      G.forEach((_, i) => { if (m >> i & 1) g = `<g clip-path="url(#c${i})">${g}</g>`; });
      hl += `<g mask="url(#m${m})">${g}</g>`;
    }
    if (els.length) { const [x, y] = POS[n][m]; txt += `<text x="${x}" y="${y}" text-anchor="middle" font-size="12.5" fill="${!pred || on ? '#181B20' : '#8A919C'}" font-weight="${on ? 500 : 400}">${esc(els.slice(0, 3).join('  '))}${els.length > 3 ? ' +' + (els.length - 3) : ''}</text>`; }
  }
  const circ = G.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${col(nm[i])[1]}" fill-opacity=".14" stroke="${col(nm[i])[1]}" stroke-width="1.5"/>`).join('');
  const lab = LAB.map(([x, y], i) => `<text x="${x}" y="${y}" font-size="14" font-weight="600" fill="${col(nm[i])[2]}">${nm[i]}</text>`).join('');
  return { html: `<svg viewBox="0 0 340 235" width="100%" role="img" aria-label="${esc(nm.join(', '))} to'plamlarining Venn diagrammasi"><defs>${defs}</defs>${circ}${hl}${txt}${lab}</svg>`, ok: tot === U.size };
}

function dots(k) { return S.sets.filter(s => s.map.has(k)).map(s => `<i class="dot" style="background:${col(s.name)[1]}"></i>`).join(''); }
function show(r) {
  S.cur = r; const m = $('#msg'), o = $('#out'), cnt = $('#count');
  const msg = h => { m.hidden = false; o.hidden = true; cnt.hidden = true; m.innerHTML = h; };
  if (S.sets.every(s => !s.map.size)) return msg("Elementlarni kiriting yoki «Namuna» tugmasini bosing.");
  if (!r) return msg("Ifodani yozing va «Hisoblash» tugmasini bosing.");
  if (r.err) return msg(`<span class="err">${esc(r.err)}</span>` + (r.fix ? '<span class="fixh">Quyidagilardan birini bosing:</span>' + r.fix.map(f => `<button class="btn" data-fix="${esc(f)}">${esc(f)}</button>`).join('') : ''));
  m.hidden = true; m.innerHTML = ''; o.hidden = false;
  const total = r.map ? r.map.size : r.pairs ? r.pairs.length : null;
  cnt.hidden = total === null; if (total !== null) cnt.textContent = total + ' ta ' + (r.pairs || r.big ? 'juftlik' : 'element');
  let say = r.say;
  if (r.map) say = r.map.size ? `${r.say}: ${r.map.size} ta topildi.` : `${r.say}: natija ∅ (bo'sh to'plam).`;
  $('#say').textContent = say; $('#sub').textContent = r.title ? 'Belgilar bilan yozilishi: ' + r.title + (r.sub ? '. ' + r.sub : '') : '';
  let vok = true, leg = '';
  if (r.venn && r.venn.nm.length >= 2 && r.venn.nm.length <= 3) {
    const v = venn(r.venn.nm, r.venn.pred); vok = v.ok; $('#venn').innerHTML = v.html;
    if (r.venn.pred) leg = '<span><i style="background:rgba(47,111,222,.5)"></i>Natijaga kiradi</span><span><i style="background:#E2E4E8"></i>Kirmaydi</span>';
  } else { $('#venn').innerHTML = ''; if (r.venn && r.venn.nm.length > 3) leg = "Diagramma faqat 2-3 to'plam uchun chiziladi."; }
  $('#legend').innerHTML = leg;
  let copy = '', els = '';
  if (r.map) {
    const e = [...r.map.entries()]; copy = e.map(x => fmt(x[1])).join(', ');
    els = e.slice(0, 300).map(([k, d]) => `<span class="chip">${esc(d)}${dots(k)}</span>`).join('') + (e.length > 300 ? `<span class="chip">… yana ${e.length - 300} ta</span>` : '');
    if (!e.length) els = '<span class="chip">∅</span>';
  } else if (r.pairs) {
    copy = r.pairs.map(p => `(${p[0]}, ${p[1]})`).join(', ');
    els = r.pairs.slice(0, 300).map(p => `<span class="chip">(${esc(p[0])}, ${esc(p[1])})</span>`).join('') + (r.pairs.length > 300 ? `<span class="chip">… yana ${r.pairs.length - 300} ta</span>` : '');
  } else if (r.big) els = '<span class="ln">Juftliklar soni 5000 dan oshdi, shuning uchun ro\'yxat ko\'rsatilmaydi. Soni yuqorida yozilgan.</span>';
  else if (r.lines) els = r.lines.map(l => `<span class="ln">${esc(l)}</span>`).join('');
  $('#els').innerHTML = els; $('#elh').hidden = !r.map && !r.pairs;
  const c = r.chk; const ck = $('#check'); const ok = (!c || c.ok) && vok;
  ck.hidden = !c; if (c) { ck.className = 'check ' + (ok ? 'ok' : 'bad'); ck.textContent = 'Tekshiruv: ' + c.text + (r.venn && r.venn.pred ? '; diagramma' : '') + (ok ? ' ✓' : ' ✗ MOS KELMADI'); }
  r.copy = copy; $('#copy').hidden = !copy; $('#save').hidden = !r.map;
}
function run() {
  let r = null;
  if (S.mode === 'oddiy') r = S.extra ? calcX() : calcOp(); else if (S.go) r = calcExpr();
  show(r);
}
function setMode(m) {
  S.mode = m; document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
  $('#opsCard').hidden = m !== 'oddiy'; $('#exprCard').hidden = m !== 'ifoda'; run();
}
function sample() {
  S.sets = []; S.pick = new Set(['A', 'B']);
  ['1, 2, 3, a, b, @', '2, 3, 4, b, c, #', '3, 5, b, d, $'].forEach(addSet);
  S.expr = '(A ∪ B) \\ C'; $('#expr').value = S.expr; S.go = true; rows(); ctl(); run();
}
function flash(b, t) { const old = b.textContent; b.textContent = t; setTimeout(() => b.textContent = old, 1200); }

document.addEventListener('input', e => {
  if (e.target.dataset.n) { const s = S.sets.find(x => x.name === e.target.dataset.n); s.text = e.target.value; parse(s); note(s); run(); }
  else if (e.target.id === 'expr') { e.target.value = e.target.value.toUpperCase(); S.expr = e.target.value; S.go = false; run(); }
  else if (e.target.id === 'optCase' || e.target.id === 'optNum') { S.o.caseSens = $('#optCase').checked; S.o.numeric = $('#optNum').checked; S.sets.forEach(s => { parse(s); note(s); }); run(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'expr') { S.go = true; run(); } });
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.mode) return setMode(d.mode);
  if (d.op) { S.op = d.op; S.extra = null; ctl(); return run(); }
  if (d.x) { S.extra = S.extra === d.x ? null : d.x; ctl(); return run(); }
  if (d.pick) { S.pick.has(d.pick) ? S.pick.delete(d.pick) : S.pick.add(d.pick); ctl(); return run(); }
  if (d.del) { S.sets = S.sets.filter(s => s.name !== d.del); S.pick.delete(d.del); rows(); ctl(); return run(); }
  if (d.k) { S.expr += d.k; $('#expr').value = S.expr; S.go = false; return run(); }
  if (d.fix) { S.expr = d.fix; $('#expr').value = S.expr; S.go = true; return run(); }
  if (b.id === 'addSet') { addSet(); rows(); ctl(); return run(); }
  if (b.id === 'sample') return sample();
  if (b.id === 'del') { S.expr = S.expr.trimEnd().slice(0, -1); $('#expr').value = S.expr; S.go = false; return run(); }
  if (b.id === 'clr') { S.expr = ''; $('#expr').value = ''; S.go = false; return run(); }
  if (b.id === 'calc') { S.go = true; return run(); }
  if (b.id === 'copy' && S.cur) {
    const t = S.cur.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const a = document.createElement('textarea'); a.value = t; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); }).finally(() => flash(b, 'Nusxalandi'));
  }
  if (b.id === 'save' && S.cur && S.cur.map) {
    const n = addSet(S.cur.copy); if (!n) return flash(b, "26 ta to'plam to'ldi");
    rows(); ctl(); flash(b, n + ' to\'plami saqlandi');
  }
});
addSet(); addSet(); S.pick = new Set(['A', 'B']); rows(); ctl(); run();
})();