(function () {
const L = typeof SetsLib !== 'undefined' ? SetsLib : require('./sets.js');
let pass = 0, fail = 0;
const log = [];
const ok = (c, m) => c ? pass++ : (fail++, log.push('XATO: ' + m));
const O = { caseSens: true, numeric: false };
const P = (t, o) => L.parseList(t, o || O);
let seed = 7;
const R = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const G = () => { const m = new Map(); for (let i = 0; i < 16; i++) if (R() < 0.45) m.set(String(i), String(i)); return m; };
const D = L.direct, U = new Map([...Array(16).keys()].map(i => [String(i), String(i)]));
const C = x => D['\\']([U, x]);

for (let t = 0; t < 300; t++) {
  const A = G(), B = G(), X = G();
  ok(L.same(D['∪']([A, B]), D['∪']([B, A])), 'birlashma o\'rin almashinuvi');
  ok(L.same(D['∩']([A, B]), D['∩']([B, A])), 'kesishma o\'rin almashinuvi');
  ok(D['∪']([A, B]).size === A.size + B.size - D['∩']([A, B]).size, '|A∪B| = |A|+|B|-|A∩B|');
  ok(L.same(D['\\']([A, B]), D['∩']([A, C(B)])), 'A\\B = A ∩ B\'');
  ok(L.same(C(D['∪']([A, B])), D['∩']([C(A), C(B)])), 'De Morgan 1');
  ok(L.same(C(D['∩']([A, B])), D['∪']([C(A), C(B)])), 'De Morgan 2');
  ok(L.same(D['∩']([A, D['∪']([B, X])]), D['∪']([D['∩']([A, B]), D['∩']([A, X])])), 'distributivlik');
  ok(L.same(D['Δ']([A, B]), D['∪']([D['\\']([A, B]), D['\\']([B, A])])), 'Δ ta\'rifi');
  ok(D['Δ']([A, B]).size === A.size + B.size - 2 * D['∩']([A, B]).size, '|AΔB| formulasi');
  for (const k of Object.keys(L.OPS))
    ok(L.same(L.evalPred([A, B, X], L.OPS[k]), D[k]([A, B, X])), 'predikat = to\'g\'ridan-to\'g\'ri: ' + k);
  const ast = L.parseExpr('(A ∪ B) \\ C', ['A', 'B', 'C']);
  const e = { A, B, C: X };
  ok(L.same(L.setAst(ast, e), D['\\']([D['∪']([A, B]), X])), 'ifoda (A∪B)\\C');
  const nm = ['A', 'B', 'C'], pr = b => L.predAst(ast, { A: b[0], B: b[1], C: b[2] });
  ok(L.same(L.evalPred([A, B, X], pr), L.setAst(ast, e)), 'ifoda: predikat = to\'plam');
}
ok(P('1, 2,,2, "a,b"').map.size === 3 && P('1, 2,,2, "a,b"').dups === 1, 'ro\'yxatni o\'qish va takrorlar');
ok(P('"say ""hi"""').map.has('say "hi"'), 'qo\'shtirnoq ichidagi qo\'shtirnoq');
ok(P('A, a').map.size === 2, 'registr farqlanadi (standart)');
ok(P('A, a', { caseSens: false, numeric: false }).map.size === 1, 'registr farqlanmaydi');
ok(P('1, 1.0, 01, +1').map.size === 4, 'sonlar matn sifatida (standart)');
ok(P('1, 1.0, 01, +1', { caseSens: true, numeric: true }).map.size === 1, 'sonlar son sifatida');
ok(P('0.50, .5, -0, 0', { caseSens: true, numeric: true }).map.size === 2, 'son kanonik shakli');
ok(P('12345678901234567890, 12345678901234567891', { caseSens: true, numeric: true }).map.size === 2, 'katta sonlar aniqligi');
ok(P('\u00e9, e\u0301').map.size === 1, 'Unicode NFC');
ok(P('').map.size === 0 && P(' , ,').map.size === 0, "bo'sh kiritish");
let err = null;
try { L.parseExpr('A ∪ B ∩ C', ['A', 'B', 'C']); } catch (x) { err = x; }
ok(err && err.fix && err.fix.length === 2 && err.fix[0] === '(A ∪ B) ∩ C' && err.fix[1] === 'A ∪ (B ∩ C)', 'aralash amal: qavs taklifi');
for (const bad of ['(A', 'A ∪', 'A B', ')', '∪ A', 'A ∪ Z', '()', 'A # B']) {
  let e2 = null; try { L.parseExpr(bad, ['A', 'B', 'C']); } catch (x) { e2 = x; }
  ok(e2, 'xato kutilgan: ' + bad);
}
ok(L.cart(P('1,2').map, P('a,b,c').map).length === 6, 'dekart ko\'paytma soni');
const out = fail ? log.slice(0, 20).join('\n') : '';
const msg = (fail ? 'TESTLAR O\'TMADI' : 'Hamma testlar o\'tdi') + ': ' + pass + ' ta o\'tdi, ' + fail + ' ta xato\n' + out;
console.log(msg);
if (typeof document !== 'undefined' && document.getElementById('o')) document.getElementById('o').textContent = msg;
if (typeof process !== 'undefined') process.exitCode = fail ? 1 : 0;
})();