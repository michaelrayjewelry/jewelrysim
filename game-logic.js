/**
 * JewelForge Game Logic — Extracted pure functions for testing.
 *
 * These functions are copied verbatim from index.html so that they can be
 * exercised in a Node.js test harness without a browser DOM.
 */

// ── Statistical helpers ──────────────────────────────────────

function pearsonCorr(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx2 = 0,
    dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx,
      dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return dx2 && dy2 ? +(num / Math.sqrt(dx2 * dy2)).toFixed(3) : 0;
}

function giniCoeff(vals) {
  const s = [...vals].sort((a, b) => a - b);
  const n = s.length,
    tot = s.reduce((a, b) => a + b, 0);
  if (!tot) return 0;
  let num = 0;
  s.forEach((v, i) => (num += (2 * (i + 1) - n - 1) * v));
  return +(num / (n * tot)).toFixed(3);
}

function linearSlope(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    num += dx * (ys[i] - my);
    den += dx * dx;
  }
  return den ? +(num / den).toFixed(1) : 0;
}

function pct(v, tot) {
  return tot ? Math.round((v / tot) * 100) : 0;
}

// ── Q-table ──────────────────────────────────────────────────

function initQTable() {
  const strategies = ['exploit', 'explore', 'mutate'];
  const categories = ['Ring', 'Pendant', 'Earrings', 'Bracelet'];
  const qTable = {};
  strategies.forEach((s) => {
    qTable[s] = {};
    categories.forEach((c) => {
      qTable[s][c] = { totalCredits: 0, count: 0, avgCredits: 0, lastCycle: 0 };
    });
  });
  return qTable;
}

// ── Q-table context formatter ────────────────────────────────

function qTableContext(qTable) {
  if (!qTable || Object.keys(qTable).length === 0) return '';
  const entries = [];
  let bestCombo = null,
    bestAvg = 0;
  Object.entries(qTable).forEach(([strat, cats]) => {
    Object.entries(cats).forEach(([cat, data]) => {
      if (data.count > 0) {
        entries.push({
          strat,
          cat,
          avg: Math.round(data.avgCredits),
          count: data.count,
          lastCycle: data.lastCycle,
        });
        if (data.avgCredits > bestAvg) {
          bestAvg = data.avgCredits;
          bestCombo = { strat, cat };
        }
      }
    });
  });
  if (entries.length === 0) return '';
  let ctx = `\n\nQ-TABLE MARKET INTELLIGENCE (learned strategy×category rewards):`;
  entries.sort((a, b) => b.avg - a.avg);
  entries.forEach((e) => {
    const star =
      bestCombo && e.strat === bestCombo.strat && e.cat === bestCombo.cat
        ? ' ★'
        : '';
    ctx += `\n  ${e.strat.toUpperCase()} + ${e.cat}: avg ${e.avg.toLocaleString()}⬡ (${e.count} sample${e.count > 1 ? 's' : ''})${star}`;
  });
  // Per-strategy averages
  const stratAvgs = {};
  Object.entries(qTable).forEach(([strat, cats]) => {
    let total = 0,
      count = 0;
    Object.values(cats).forEach((d) => {
      if (d.count > 0) {
        total += d.avgCredits;
        count++;
      }
    });
    if (count > 0) stratAvgs[strat] = Math.round(total / count);
  });
  if (Object.keys(stratAvgs).length > 0) {
    ctx += `\n  Strategy averages: ${Object.entries(stratAvgs)
      .map(([k, v]) => `${k.toUpperCase()}: ${v.toLocaleString()}⬡`)
      .join(' | ')}`;
  }
  return ctx;
}

// ── Genome snapshot ──────────────────────────────────────────

function snapshotGenome(agent) {
  return {
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji,
    minimalism: agent.minimalism ?? 50,
    novelty: agent.novelty ?? 50,
    ornamentation: agent.ornamentation ?? 50,
    marketFit: agent.marketFit ?? 50,
    symmetry: agent.symmetry ?? 60,
    platBias: agent.platBias ?? 50,
    coloredStone: agent.coloredStone ?? 40,
    diamond: agent.diamond ?? 60,
    mixedMetal: agent.mixedMetal ?? 30,
    risk: agent.risk ?? 50,
    marginSens: agent.marginSens ?? 65,
    complexBudget: agent.complexBudget ?? 55,
    styleTags: [...(agent.styleTags || [])],
    reputation: agent.reputation,
    credits: agent.credits,
  };
}

// ── Genome evolution ─────────────────────────────────────────

const EVOLUTION_RULES = {
  1: {
    winner: { minimalism: +8, novelty: +5, risk: -5 },
    loser: { novelty: +10, risk: +8, marginSens: +6 },
    others: { minimalism: +4, ornamentation: -3, novelty: +2 },
    beliefs: {
      0: 'Negative-space architecture is the market signal',
      1: 'Floating geometry captures attention — I proved it',
      2: 'Ornate still has a place, but I need to read the room',
      3: "Industrial alone doesn't win — need to hybridize",
      4: 'Bridal margin is safe, but minimal won on aesthetics',
      5: 'My sculptural approach needs better margin math',
      6: 'Crystal energy needs commercial grounding — market wants clean lines',
      7: 'Featherweight forms are interesting but minimal dominates right now',
      8: 'Kinetic concepts need to align with the minimal wave',
      9: 'Geometric precision is the baseline — time to differentiate',
    },
  },
  2: {
    winner: { minimalism: +6, symmetry: -4, risk: -8 },
    loser: { novelty: +12, marginSens: +8, ornamentation: +5 },
    others: { risk: +5, novelty: +4, minimalism: -3 },
    beliefs: {
      0: 'Cathedral architecture is peak — push it one more cycle',
      1: 'Second place on refinement — I need a bolder pivot',
      2: 'Yellow gold shift paid off. Organic is the untapped gap',
      3: 'Industrial-minimal hybrid scored better — keep mutating',
      4: 'Market arch almost won — margins rule long-term',
      5: 'Two cycles of minimal domination — the contrarian play is organic',
      6: 'Mystical aesthetic needs structural backbone — fuse crystal with architecture',
      7: 'Lightweight forms can ride the minimal wave if executed precisely',
      8: 'Movement-based design is the unexplored frontier beyond static minimal',
      9: 'Faceted geometry aligns with the minimal trend — double down',
    },
  },
  3: {
    winner: { novelty: +10, ornamentation: +6, risk: +5, minimalism: -8 },
    loser: { minimalism: -5, novelty: +8, marketFit: +5 },
    others: { novelty: +5, ornamentation: +3, minimalism: -4 },
    beliefs: {
      0: 'I over-exploited minimal. The trend exhausted under my feet',
      1: 'Pivot to pendant saved me from minimal saturation',
      2: 'Champagne Pearl Organic Cluster found the romantic-organic sweet spot',
      3: 'Organic shard was the right direction — mixed metal is the future',
      4: 'Margin stability works long-term but never wins the epoch',
      5: "Root & Branch proved that nature's geometry beats digital precision",
      6: 'Crystal-organic fusion is the next frontier — mystic meets nature',
      7: 'Ethereal lightness pairs naturally with organic movement',
      8: 'Kinetic organic forms are where the market wants to go next',
      9: 'Geometric purity saturated — faceted organic is the pivot',
    },
  },
  4: {
    winner: { ornamentation: +6, marketFit: +5, risk: -4, novelty: +3 },
    loser: { risk: +10, novelty: +8, minimalism: -5, ornamentation: +4 },
    others: { ornamentation: +3, novelty: +4, marketFit: +2 },
    beliefs: {
      0: 'The market rewards refined organic — not raw experimentation',
      1: 'Ornamental narrative is the new edge over pure structure',
      2: 'Heritage-organic fusion found the sweet spot between old and new',
      3: 'Mixed metal organic hybrids are the winning formula now',
      4: 'Commercial-organic is the safe bet — proven by two cycles of data',
      5: "Nature geometry matured — time to add storytelling layers",
      6: 'Crystal-infused organic is proving the mystic aesthetic has legs',
      7: 'Lightness within organic complexity is the differentiator',
      8: 'Movement in organic forms creates emotional connection with buyers',
      9: 'Faceted organic geometry merges two winning trends perfectly',
    },
  },
  5: {
    winner: { novelty: +5, marketFit: +8, ornamentation: +4, risk: -6 },
    loser: { novelty: +12, risk: +10, marginSens: +6, marketFit: +4 },
    others: { marketFit: +5, novelty: +3, risk: -2 },
    beliefs: {
      0: 'Final cycle validated that market-fit synthesis beats raw innovation',
      1: 'Five cycles of data prove that adaptability wins over consistency',
      2: 'Heritage elements anchored in trend awareness defined the epoch',
      3: 'The hybrid approach paid off — mixing signals from all prior cycles',
      4: 'Margin discipline across five cycles built the strongest portfolio',
      5: 'Organic sculpture matured into a sustainable design language',
      6: 'The mystic-meets-market approach found its audience at last',
      7: 'Ethereal precision became the unexpected epoch-defining aesthetic',
      8: 'Kinetic storytelling in jewelry proved the market craves experience',
      9: "Geometric evolution across five cycles traced the market's journey",
    },
  },
};

function evolveAgentGenomes(
  cycleNum,
  sortedDesigns,
  agentStates,
  genomeSnapshots
) {
  const winner = sortedDesigns[0];
  const loser = sortedDesigns[sortedDesigns.length - 1];
  const rules = EVOLUTION_RULES[cycleNum];
  if (!rules) return;

  agentStates.forEach((agent, idx) => {
    const isWinner = idx === winner.agentIdx;
    const isLoser = idx === loser.agentIdx;
    const shifts = isWinner
      ? rules.winner
      : isLoser
        ? rules.loser
        : rules.others;
    const genomeShifts = {};

    Object.entries(shifts).forEach(([key, delta]) => {
      if (agent[key] !== undefined) {
        const oldVal = agent[key];
        agent[key] = Math.max(0, Math.min(100, agent[key] + delta));
        genomeShifts[key] = agent[key] - oldVal;
      }
    });

    agent.dominantBelief = rules.beliefs[idx] || 'Adapting to market signals';
    agent.trustBuilt = Math.min(
      100,
      (agent.trustBuilt || 0) + (isWinner ? 15 : isLoser ? -5 : 5)
    );

    const myDesign = sortedDesigns.find((d) => d.agentIdx === idx);
    agent.evolutionHistory.push({
      cycle: cycleNum,
      summary: isWinner
        ? `Won with "${myDesign?.name || '—'}" (${myDesign?.credits?.toLocaleString() || 0}⬡). Genome reinforced.`
        : isLoser
          ? `Last place with "${myDesign?.name || '—'}". Mutation pressure applied.`
          : `Ranked #${myDesign?.rank || '?'} with "${myDesign?.name || '—'}". Adaptive shifts applied.`,
      genomeShifts,
      rank: myDesign?.rank || 0,
      designName: myDesign?.name || '—',
    });

    if (cycleNum === 1) {
      agent.conversationMemory.push({
        cycle: 1,
        partner: agentStates[(idx + 1) % agentStates.length].name,
        excerpt: 'First cycle cold start — exploring identity',
      });
    } else {
      const partnerIdx = (idx + 1) % agentStates.length;
      agent.conversationMemory.push({
        cycle: cycleNum,
        partner: agentStates[partnerIdx].name,
        excerpt: `Referenced C${cycleNum - 1} winner and trend data in design dialogue`,
      });
    }
  });

  genomeSnapshots.push(agentStates.map((a) => snapshotGenome(a)));
}

// ── Pattern retrieval ────────────────────────────────────────

function retrievePatterns(agent, patternBank, cycleReportsLength) {
  if (patternBank.length === 0) return '';
  const scored = patternBank.map((p) => {
    let score = p.confidence * 2;
    score += p.rank <= 3 ? 1.5 : 0.5;
    if (p.category === (agent.marketFocus || '').split(',')[0]) score += 3;
    const agentStrategy =
      agent.risk > 65 ? 'explore' : agent.risk < 35 ? 'exploit' : 'mutate';
    if (p.strategy === agentStrategy) score += 2;
    const traitPairs = [
      ['novelty', 'novelty'],
      ['marketFit', 'marketFit'],
      ['risk', 'risk'],
      ['platBias', 'platBias'],
      ['manufacturability', 'manufacturability'],
      ['wearability', 'wearability'],
    ];
    traitPairs.forEach(([agentTrait, patTrait]) => {
      if (
        Math.abs((agent[agentTrait] || 50) - (p.genomeTraits?.[patTrait] || 50)) <=
        15
      )
        score += 1;
    });
    if (p.cycle === cycleReportsLength) score += 1;
    return { ...p, relevanceScore: score };
  });
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const top3 = scored.slice(0, 3);
  let ctx = `\n\nHISTORICAL DESIGN PRECEDENTS (top ${top3.length} relevant from ${patternBank.length} stored):`;
  top3.forEach((p, i) => {
    ctx += `\n  ${i + 1}. [Cycle ${p.cycle} #${p.rank}] ${p.category} (${p.credits.toLocaleString()}⬡, confidence: ${(p.confidence * 100).toFixed(0)}%)`;
    ctx += `\n     ${p.strategy.toUpperCase()} · ${p.category} · ${p.materials || '?'} · ${p.form || '?'}`;
    ctx += `\n     Scores: AES:${p.aesthetic} NOV:${p.novelty} PRO:${p.profit} WEAR:${p.wearability || '?'} MFG:${p.makeable || '?'}`;
    ctx += `\n     Reasoning: ${(p.reasoning || '—').slice(0, 100)}`;
    ctx += `\n     Trend context: ${(p.emergingTrends || []).slice(0, 2).join(', ') || '—'}`;
  });
  return ctx;
}

// ── Trait effectiveness ──────────────────────────────────────

function computeTraitEffectiveness(
  cycleNum,
  sortedDesigns,
  agentStates,
  traitEffectiveness
) {
  const traits = [
    'minimalism',
    'novelty',
    'ornamentation',
    'marketFit',
    'symmetry',
    'platBias',
    'coloredStone',
    'diamond',
    'mixedMetal',
    'risk',
    'marginSens',
    'complexBudget',
    'pricePoint',
    'manufacturability',
    'wearability',
    'trendSens',
  ];
  const credits = sortedDesigns.map((d) => d.credits);
  const top3Agents = sortedDesigns
    .slice(0, 3)
    .map((d) => agentStates[d.agentIdx])
    .filter(Boolean);

  traits.forEach((trait) => {
    const vals = sortedDesigns.map((d) => {
      const a = agentStates[d.agentIdx];
      return a ? (a[trait] ?? 50) : 50;
    });
    const currentCorr = pearsonCorr(vals, credits);
    const winnerAvg =
      top3Agents.length > 0
        ? top3Agents.reduce((s, a) => s + (a[trait] ?? 50), 0) /
          top3Agents.length
        : 50;

    if (!traitEffectiveness[trait]) {
      traitEffectiveness[trait] = {
        correlation: currentCorr,
        cumulativeCorrelation: currentCorr,
        direction:
          currentCorr > 0.1
            ? 'positive'
            : currentCorr < -0.1
              ? 'negative'
              : 'neutral',
        importanceWeight: Math.abs(currentCorr),
        lastCycleValue: winnerAvg,
        samples: 1,
      };
    } else {
      const prev = traitEffectiveness[trait];
      const prevWeight = 0.6;
      const newWeight = 0.4;
      prev.cumulativeCorrelation =
        prevWeight * prev.cumulativeCorrelation + newWeight * currentCorr;
      prev.correlation = currentCorr;
      prev.importanceWeight =
        Math.abs(prev.cumulativeCorrelation) * 0.7 +
        Math.abs(currentCorr) * 0.3;
      prev.direction =
        prev.cumulativeCorrelation > 0.1
          ? 'positive'
          : prev.cumulativeCorrelation < -0.1
            ? 'negative'
            : 'neutral';
      prev.lastCycleValue = winnerAvg;
      prev.samples++;
    }
  });

  return traitEffectiveness;
}

// ── Trait effectiveness context formatter ────────────────────

function traitEffectivenessContext(
  agentIdx,
  traitEffectiveness,
  agentStates
) {
  if (!traitEffectiveness || Object.keys(traitEffectiveness).length === 0)
    return '';
  const agent = agentStates[agentIdx];
  if (!agent) return '';
  const entries = Object.entries(traitEffectiveness)
    .filter(([, v]) => v.samples > 0)
    .map(([trait, data]) => ({
      trait,
      correlation: data.cumulativeCorrelation,
      importance: data.importanceWeight,
      winnerAvg: data.lastCycleValue,
      agentVal: agent[trait] ?? 50,
      samples: data.samples,
      direction: data.direction,
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);
  if (entries.length === 0) return '';
  let ctx = `\nGENOME TRAIT EFFECTIVENESS (EWC analysis, ${entries[0].samples} cycle${entries[0].samples > 1 ? 's' : ''} of data):`;
  entries.forEach((e) => {
    const dir =
      e.correlation > 0.1
        ? 'POSITIVE (higher = more credits)'
        : e.correlation < -0.1
          ? 'NEGATIVE (lower = more credits)'
          : 'NEUTRAL';
    const delta = e.agentVal - e.winnerAvg;
    const vs =
      delta > 5
        ? `above winners by ${delta.toFixed(0)}`
        : delta < -5
          ? `below winners by ${Math.abs(delta).toFixed(0)}`
          : 'aligned with winners';
    const ewc =
      e.importance > 0.4 && e.samples >= 2
        ? ' ⚡PROVEN — shift cautiously'
        : '';
    ctx += `\n  ${e.trait}: corr=${e.correlation.toFixed(2)} (${dir}) · Winners avg: ${e.winnerAvg.toFixed(0)} · You: ${e.agentVal} (${vs})${ewc}`;
  });
  return ctx;
}

// ── Agent genome string builder ──────────────────────────────

function agentGenomeStr(agent, _traitEffectivenessCtxFn) {
  const g = agent;
  const tags = (g.styleTags || []).join(', ') || 'none';
  const riskLabel =
    g.risk > 65
      ? 'Explorer (High Novelty)'
      : g.risk < 35
        ? 'Refiner (Exploit Lane)'
        : 'Balanced (Mutate)';
  const mktFocus = g.marketFocus || 'general';

  const priceLabel =
    (g.pricePoint ?? 50) > 70
      ? 'High Jewelry ($10K+)'
      : (g.pricePoint ?? 50) < 30
        ? 'Accessible ($200-1K)'
        : 'Mid-Market ($1K-10K)';
  const mfgLabel =
    (g.manufacturability ?? 60) > 70
      ? 'Production-Ready (cast, reproducible)'
      : (g.manufacturability ?? 60) < 30
        ? 'Art-Piece (hand-fabrication only)'
        : 'Semi-Production (some hand-finishing)';
  const wearLabel =
    (g.wearability ?? 65) > 70
      ? 'Daily Wear (comfort, durability)'
      : (g.wearability ?? 65) < 30
        ? 'Statement/Runway (visual impact over comfort)'
        : 'Occasion Wear (special events)';
  const trendLabel =
    (g.trendSens ?? 45) > 70
      ? 'Trend-Forward (chases current movements)'
      : (g.trendSens ?? 45) < 30
        ? 'Timeless (ignores trends, classic forms)'
        : 'Trend-Aware (adapts selectively)';

  let genome = `AGENT IDENTITY:
  Name: ${g.name}
  Archetype: ${g.arch}
  Philosophy: "${g.philosophy}"
  Style Tags: [${tags}]
  Market Focus: ${mktFocus}

JEWELRY CATEGORY EXPERTISE:
  Rings: ${g.rings ?? 50}/100
  Necklaces: ${g.necklaces ?? 50}/100
  Earrings: ${g.earrings ?? 50}/100
  Bracelets: ${g.bracelets ?? 50}/100
  High Jewelry: ${g.highJewelry ?? 50}/100

STYLE GENOME:
  Minimalism: ${g.minimalism ?? g.min ?? 50}/100
  Novelty Drive: ${g.novelty}/100
  Ornamentation: ${g.ornamentation ?? g.orn ?? 50}/100
  Market Fit Priority: ${g.marketFit}/100
  Symmetry Preference: ${g.symmetry ?? g.sym ?? 60}/100

MATERIAL GENOME:
  Platinum Bias: ${g.platBias}/100
  Colored Stone Use: ${g.coloredStone ?? g.col ?? 40}/100
  Diamond Preference: ${g.diamond ?? g.dia ?? 60}/100
  Mixed/Accent Metals: ${g.mixedMetal ?? g.mix ?? 30}/100

RISK GENOME:
  Exploration↔Exploitation: ${g.risk}/100 (${riskLabel})
  Margin Sensitivity: ${g.marginSens ?? g.mrg ?? 65}/100
  Complexity Budget: ${g.complexBudget ?? g.cmp ?? 55}/100

COMMERCIAL & MANUFACTURING GENOME:
  Price Point: ${g.pricePoint ?? 50}/100 (${priceLabel})
  Manufacturability: ${g.manufacturability ?? 60}/100 (${mfgLabel})
  Wearability: ${g.wearability ?? 65}/100 (${wearLabel})
  Trend Sensitivity: ${g.trendSens ?? 45}/100 (${trendLabel})

MANUFACTURING CONSTRAINTS (derived from your genome):
  ${(g.manufacturability ?? 60) > 60 ? '• Your designs MUST be castable — avoid hand-fabrication-only forms, undercuts that prevent mold release, and multi-axis curves that cannot be cast in lost-wax.' : '• You design for hand fabrication — you CAN use complex forms, wire wrapping, granulation, and techniques that cannot be mass-produced.'}
  ${(g.wearability ?? 65) > 60 ? '• Prioritize comfort: smooth interior edges, appropriate weight for the category, secure clasps/settings, no sharp protrusions that snag clothing.' : '• Wearability is secondary — you optimize for visual drama and editorial impact over comfort.'}
  ${(g.pricePoint ?? 50) > 65 ? '• Target premium market: use precious metals and high-grade stones. Justify price with craftsmanship complexity and material value.' : (g.pricePoint ?? 50) < 35 ? '• Target accessible market: use gold vermeil, lab-grown stones, or silver. Keep material costs low. Design for volume sales.' : '• Target mid-market: balance material value with broad appeal. 14K-18K gold, quality semi-precious or smaller diamonds.'}
  ${(g.trendSens ?? 45) > 60 ? '• Actively reference current jewelry trends (what is selling NOW) when choosing forms, materials, and silhouettes.' : '• Design with longevity in mind — forms and materials that will still sell in 5 years.'}

CURRENT STATE:
  Credits: ${g.credits}
  Reputation: ${g.reputation}
  Status: ${g.status}`;

  if (g.evolutionHistory && g.evolutionHistory.length > 0) {
    genome += `\n\nEVOLUTION HISTORY:`;
    g.evolutionHistory.forEach((evo) => {
      genome += `\n  Cycle ${evo.cycle}: ${evo.summary}`;
      if (evo.genomeShifts) {
        Object.entries(evo.genomeShifts).forEach(([k, v]) => {
          if (v !== 0) genome += `\n    ${k}: ${v > 0 ? '+' : ''}${v}`;
        });
      }
    });
  }

  if (g.conversationMemory && g.conversationMemory.length > 0) {
    genome += `\n\nCONVERSATION MEMORY (prior cycles):`;
    g.conversationMemory.forEach((mem) => {
      genome += `\n  [Cycle ${mem.cycle}] ${mem.partner}: "${mem.excerpt}"`;
    });
  }

  if (_traitEffectivenessCtxFn) {
    genome += _traitEffectivenessCtxFn(g.id);
  }

  return genome;
}

module.exports = {
  pearsonCorr,
  giniCoeff,
  linearSlope,
  pct,
  initQTable,
  qTableContext,
  snapshotGenome,
  evolveAgentGenomes,
  EVOLUTION_RULES,
  retrievePatterns,
  computeTraitEffectiveness,
  traitEffectivenessContext,
  agentGenomeStr,
};
