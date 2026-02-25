#!/usr/bin/env node
/**
 * JewelForge Game Logic Test Suite
 * Tests all core game mechanics without a browser environment.
 */

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) {
    console.log(`  ✓ ${msg} (= ${actual})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

/* ══════════════════════════════════
   CONSTANTS (mirrored from game)
══════════════════════════════════ */
const CYCLE_DESIGNS = [
  [ // CYCLE 1
    { name:'Void Solitaire',  cat:'Ring',     emoji:'⬡', agentIdx:0, strategy:'explore', aesthetic:71, novelty:78, profit:68 },
    { name:'Orbit Drop',      cat:'Earrings', emoji:'🌑', agentIdx:1, strategy:'explore', aesthetic:85, novelty:82, profit:74 },
    { name:'Cascade Pavé',    cat:'Pendant',  emoji:'✨', agentIdx:2, strategy:'exploit', aesthetic:79, novelty:52, profit:72 },
    { name:'Hex Frame',       cat:'Bracelet', emoji:'🔷', agentIdx:3, strategy:'explore', aesthetic:67, novelty:90, profit:50 },
    { name:'Silk Halo',       cat:'Ring',     emoji:'💍', agentIdx:4, strategy:'exploit', aesthetic:77, novelty:40, profit:88 },
    { name:'Thorn Band',      cat:'Ring',     emoji:'🌹', agentIdx:5, strategy:'explore', aesthetic:73, novelty:80, profit:46 },
  ],
  [ // CYCLE 2
    { name:'Cathedral Void',  cat:'Ring',     emoji:'⬡', agentIdx:0, strategy:'exploit', aesthetic:88, novelty:79, profit:74 },
    { name:'Phase Ring',      cat:'Ring',     emoji:'🌑', agentIdx:1, strategy:'exploit', aesthetic:82, novelty:68, profit:77 },
    { name:'Sapphire Canopy', cat:'Pendant',  emoji:'💙', agentIdx:2, strategy:'exploit', aesthetic:81, novelty:54, profit:76 },
    { name:'Arc Shard',       cat:'Ring',     emoji:'⚡', agentIdx:3, strategy:'mutate',  aesthetic:74, novelty:88, profit:55 },
    { name:'Market Arch',     cat:'Ring',     emoji:'💎', agentIdx:4, strategy:'exploit', aesthetic:80, novelty:52, profit:91 },
    { name:'Bone Structure',  cat:'Bracelet', emoji:'🦴', agentIdx:5, strategy:'mutate',  aesthetic:76, novelty:85, profit:52 },
  ],
  [ // CYCLE 3
    { name:'Negative Cathedral', cat:'Ring',     emoji:'⬡', agentIdx:0, strategy:'exploit', aesthetic:84, novelty:72, profit:71 },
    { name:'Arc Minimal',     cat:'Pendant',  emoji:'🌑', agentIdx:1, strategy:'mutate',  aesthetic:80, novelty:74, profit:72 },
    { name:'Bloom Fragment',  cat:'Pendant',  emoji:'🌸', agentIdx:2, strategy:'explore', aesthetic:83, novelty:76, profit:73 },
    { name:'Forge Shard',     cat:'Ring',     emoji:'🔥', agentIdx:3, strategy:'mutate',  aesthetic:79, novelty:91, profit:56 },
    { name:'Root Form',       cat:'Bracelet', emoji:'🌿', agentIdx:5, strategy:'explore', aesthetic:91, novelty:89, profit:67 },
    { name:'Consensus Cut',   cat:'Ring',     emoji:'💛', agentIdx:4, strategy:'exploit', aesthetic:78, novelty:45, profit:92 },
  ],
];

const VOTE_MATRICES = [
  // C1: Orbit Drop (idx 1) wins — each row sums to 10,000⬡
  [[0,4200,2100,800,1200,1700],[4800,0,2000,600,1400,1200],[3200,3800,0,500,2100,400],[3100,3600,2200,0,800,300],[2800,4100,1800,300,0,1000],[2900,3900,1900,400,900,0]],
  // C2: Cathedral Void (idx 0) wins — each row sums to 10,000⬡
  [[0,3600,2800,1100,2500,0],[5100,0,1900,700,2300,0],[4200,1800,0,900,3100,0],[3800,2400,1600,0,2200,0],[4600,2100,2300,500,500,0],[3500,2900,2100,600,900,0]],
  // C3: Root Form (idx 4) wins — each row sums to 10,000⬡
  [[2100,1800,2400,1200,1800,700],[1900,1600,2200,900,2900,500],[1700,2000,1500,800,3400,600],[2200,1400,1800,1000,3200,400],[1800,1700,2800,600,2400,700],[2400,1900,2100,1100,2500,0]],
];

const AGENT_NAMES = ['User', 'Ryo Tanaka', 'Soleil Du', 'Kael Strand', 'Asha Noor', 'Léa Fontaine'];

/* ══════════════════════════════════
   ANALYTICS (mirrored from game)
══════════════════════════════════ */
function pearsonCorr(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, dx2=0, dy2=0;
  for(let i=0;i<n;i++){
    const dx=xs[i]-mx, dy=ys[i]-my;
    num+=dx*dy; dx2+=dx*dx; dy2+=dy*dy;
  }
  return dx2&&dy2 ? +(num/Math.sqrt(dx2*dy2)).toFixed(3) : 0;
}

function giniCoeff(vals) {
  const s = [...vals].sort((a,b)=>a-b);
  const n = s.length, tot = s.reduce((a,b)=>a+b,0);
  if (!tot) return 0;
  let num = 0;
  s.forEach((v,i) => num += (2*(i+1)-n-1)*v);
  return +(num / (n*tot)).toFixed(3);
}

function linearSlope(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, den=0;
  for(let i=0;i<n;i++){ const dx=xs[i]-mx; num+=dx*(ys[i]-my); den+=dx*dx; }
  return den ? +(num/den).toFixed(1) : 0;
}

/* ══════════════════════════════════
   TEST 1: VOTE MATRIX ROW SUMS
══════════════════════════════════ */
console.log('\n══ TEST 1: Vote Matrix Row Sums (each voter must spend exactly 10,000⬡) ══');
const BUDGET = 10000;
VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  console.log(`\n  Cycle ${cycleIdx + 1}:`);
  matrix.forEach((row, voterIdx) => {
    const total = row.reduce((a, b) => a + b, 0);
    const agentName = AGENT_NAMES[voterIdx];
    assert(total === BUDGET, `${agentName} spends exactly ${BUDGET}⬡ (actual: ${total}⬡)`);
  });
});

/* ══════════════════════════════════
   TEST 2: DESIGN CREDIT TALLYING & WINNER DETERMINATION
══════════════════════════════════ */
console.log('\n══ TEST 2: Credit Tallying & Winner Determination ══');

const EXPECTED_WINNERS = [
  { cycle: 1, designIdx: 1, name: 'Orbit Drop',      agentIdx: 1, agentName: 'Ryo Tanaka' },
  { cycle: 2, designIdx: 0, name: 'Cathedral Void',  agentIdx: 0, agentName: 'User' },
  { cycle: 3, designIdx: 4, name: 'Root Form',       agentIdx: 5, agentName: 'Léa Fontaine' },
];

VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  const designs = CYCLE_DESIGNS[cycleIdx];
  const credits = new Array(designs.length).fill(0);

  // Tally credits
  matrix.forEach((row, voterIdx) => {
    row.forEach((amount, designIdx) => {
      if (designIdx < designs.length) credits[designIdx] += amount;
    });
  });

  const sorted = credits
    .map((c, i) => ({ idx: i, credits: c, name: designs[i].name, agentIdx: designs[i].agentIdx }))
    .sort((a, b) => b.credits - a.credits);

  const winner = sorted[0];
  const expected = EXPECTED_WINNERS[cycleIdx];

  console.log(`\n  Cycle ${cycleIdx + 1} Results:`);
  sorted.forEach((d, rank) => {
    console.log(`    ${rank + 1}. "${d.name}" (agentIdx:${d.agentIdx}) — ${d.credits.toLocaleString()}⬡`);
  });

  assertEq(winner.idx, expected.designIdx, `Cycle ${cycleIdx+1} winner is design #${expected.designIdx} "${expected.name}"`);
  assertEq(winner.agentIdx, expected.agentIdx, `Cycle ${cycleIdx+1} winner agent is agentIdx ${expected.agentIdx} (${expected.agentName})`);
  assert(winner.credits > sorted[1].credits, `Cycle ${cycleIdx+1} winner has strictly more credits than 2nd place`);
});

/* ══════════════════════════════════
   TEST 3: ANALYTICS FUNCTIONS
══════════════════════════════════ */
console.log('\n══ TEST 3: Analytics Functions ══');

// Pearson correlation
const xs1 = [1, 2, 3, 4, 5];
const ys1 = [2, 4, 6, 8, 10]; // perfect positive correlation
assertEq(pearsonCorr(xs1, ys1), 1, 'Pearson: perfect positive correlation = 1.000');

const ys2 = [10, 8, 6, 4, 2]; // perfect negative correlation
assertEq(pearsonCorr(xs1, ys2), -1, 'Pearson: perfect negative correlation = -1.000');

const ys3 = [3, 3, 3, 3, 3]; // no correlation (constant)
assertEq(pearsonCorr(xs1, ys3), 0, 'Pearson: constant ys = 0 (no correlation)');

// Gini coefficient
const equal = [100, 100, 100, 100]; // perfectly equal → gini=0
assertEq(giniCoeff(equal), 0, 'Gini: perfectly equal distribution = 0');

const maxConc = [0, 0, 0, 1000]; // maximum concentration
assert(giniCoeff(maxConc) > 0.6, 'Gini: highly concentrated distribution > 0.6');

// Linear slope
const lxs = [1, 2, 3, 4, 5];
const lys = [2, 4, 6, 8, 10]; // slope = 2
assertEq(linearSlope(lxs, lys), 2.0, 'LinearSlope: perfect slope of 2.0');

const lys2 = [5, 5, 5, 5, 5]; // slope = 0
assertEq(linearSlope(lxs, lys2), 0.0, 'LinearSlope: flat data = 0.0');

/* ══════════════════════════════════
   TEST 4: PEARSON CORRELATION WITH REAL CYCLE DATA
══════════════════════════════════ */
console.log('\n══ TEST 4: Vote-Score Correlation (Real Cycle Data) ══');

VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  const designs = CYCLE_DESIGNS[cycleIdx];
  const credits = new Array(designs.length).fill(0);
  matrix.forEach(row => row.forEach((amount, di) => { if (di < designs.length) credits[di] += amount; }));

  const corrAes = pearsonCorr(designs.map(d=>d.aesthetic), credits);
  const corrNov = pearsonCorr(designs.map(d=>d.novelty), credits);
  const corrPro = pearsonCorr(designs.map(d=>d.profit), credits);
  const topCorr = corrAes>=corrNov&&corrAes>=corrPro?'Aesthetic':corrNov>=corrPro?'Novelty':'Profit';

  console.log(`\n  Cycle ${cycleIdx+1}: r(Aesthetic)=${corrAes}, r(Novelty)=${corrNov}, r(Profit)=${corrPro} → Top: ${topCorr}`);
  assert(typeof corrAes === 'number' && !isNaN(corrAes), `Cycle ${cycleIdx+1}: corrAes is a valid number`);
  assert(Math.abs(corrAes) <= 1, `Cycle ${cycleIdx+1}: corrAes within [-1, 1]`);
  assert(typeof topCorr === 'string', `Cycle ${cycleIdx+1}: topCorr is a string`);
});

/* ══════════════════════════════════
   TEST 5: GINI ON REAL VOTE DATA
══════════════════════════════════ */
console.log('\n══ TEST 5: Gini Coefficient on Real Vote Data ══');

VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  const designs = CYCLE_DESIGNS[cycleIdx];
  const credits = new Array(designs.length).fill(0);
  matrix.forEach(row => row.forEach((amount, di) => { if (di < designs.length) credits[di] += amount; }));

  const gini = giniCoeff(credits);
  console.log(`  Cycle ${cycleIdx+1}: Gini = ${gini}`);
  assert(gini >= 0 && gini <= 1, `Cycle ${cycleIdx+1}: Gini in [0,1]`);
  assert(gini > 0, `Cycle ${cycleIdx+1}: some vote concentration exists (Gini > 0)`);
});

/* ══════════════════════════════════
   TEST 6: AGENT CREDIT BUDGET AFTER VOTING
══════════════════════════════════ */
console.log('\n══ TEST 6: Agent Credits After Voting (should be ≥ 0) ══');

VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  console.log(`\n  Cycle ${cycleIdx+1}:`);
  matrix.forEach((row, voterIdx) => {
    const spent = row.reduce((a, b) => a + b, 0);
    const remaining = BUDGET - spent;
    const agentName = AGENT_NAMES[voterIdx];
    assert(remaining >= 0, `${agentName} remaining credits ≥ 0 (remaining: ${remaining}⬡)`);
  });
});

/* ══════════════════════════════════
   TEST 7: DESIGN COUNT PER CYCLE
══════════════════════════════════ */
console.log('\n══ TEST 7: Design Pool Integrity ══');
CYCLE_DESIGNS.forEach((designs, cycleIdx) => {
  assertEq(designs.length, 6, `Cycle ${cycleIdx+1}: exactly 6 designs in pool`);
  const agentIndices = designs.map(d => d.agentIdx);
  const unique = new Set(agentIndices).size;
  assertEq(unique, 6, `Cycle ${cycleIdx+1}: each of 6 agents submits exactly 1 design`);
});

/* ══════════════════════════════════
   TEST 8: VOTE MATRIX DIMENSIONS
══════════════════════════════════ */
console.log('\n══ TEST 8: Vote Matrix Dimensions ══');
VOTE_MATRICES.forEach((matrix, cycleIdx) => {
  assertEq(matrix.length, 6, `Cycle ${cycleIdx+1}: matrix has 6 voter rows`);
  matrix.forEach((row, vi) => {
    assertEq(row.length, 6, `Cycle ${cycleIdx+1} voter ${vi}: row has 6 entries (one per design)`);
  });
});

/* ══════════════════════════════════
   TEST 9: NO NEGATIVE AESTHETIC/NOVELTY/PROFIT SCORES
══════════════════════════════════ */
console.log('\n══ TEST 9: Score Values In Range [0, 100] ══');
CYCLE_DESIGNS.forEach((designs, cycleIdx) => {
  designs.forEach((d, di) => {
    assert(d.aesthetic >= 0 && d.aesthetic <= 100, `Cycle ${cycleIdx+1} design ${di} (${d.name}): aesthetic in [0,100]`);
    assert(d.novelty   >= 0 && d.novelty   <= 100, `Cycle ${cycleIdx+1} design ${di} (${d.name}): novelty in [0,100]`);
    assert(d.profit    >= 0 && d.profit    <= 100, `Cycle ${cycleIdx+1} design ${di} (${d.name}): profit in [0,100]`);
  });
});

/* ══════════════════════════════════
   SUMMARY
══════════════════════════════════ */
console.log('\n══════════════════════════════════════');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('All tests passed! ✓');
} else {
  console.log(`${failed} test(s) FAILED ✗`);
  process.exit(1);
}
