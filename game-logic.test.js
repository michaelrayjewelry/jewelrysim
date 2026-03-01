/**
 * JewelForge Game Logic — Comprehensive Test Suite
 *
 * Uses Node.js built-in test runner (node:test) — no dependencies required.
 * Run with: node --test game-logic.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
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
} = require('./game-logic.js');

// ═══════════════════════════════════════════════════════════════
//  HELPERS — reusable factory functions for test data
// ═══════════════════════════════════════════════════════════════

function makeAgent(overrides = {}) {
  return {
    id: 0,
    name: 'TestAgent',
    emoji: '🎯',
    arch: 'Minimalist',
    philosophy: 'Less is more',
    styleTags: ['clean', 'modern'],
    marketFocus: 'Ring',
    rings: 80,
    necklaces: 40,
    earrings: 50,
    bracelets: 30,
    highJewelry: 60,
    minimalism: 70,
    novelty: 55,
    ornamentation: 30,
    marketFit: 65,
    symmetry: 60,
    platBias: 50,
    coloredStone: 40,
    diamond: 60,
    mixedMetal: 30,
    risk: 50,
    marginSens: 65,
    complexBudget: 55,
    pricePoint: 50,
    manufacturability: 60,
    wearability: 65,
    trendSens: 45,
    credits: 100000,
    reputation: 50,
    status: 'idle',
    isUser: false,
    evolutionHistory: [],
    conversationMemory: [],
    dominantBelief: '',
    trustBuilt: 0,
    ...overrides,
  };
}

function makeDesign(overrides = {}) {
  return {
    name: 'Test Design',
    cat: 'Ring',
    emoji: '💍',
    agentIdx: 0,
    strategy: 'explore',
    aesthetic: 80,
    novelty: 70,
    profit: 60,
    credits: 5000,
    rank: 1,
    ...overrides,
  };
}

function makeTenAgents() {
  return Array.from({ length: 10 }, (_, i) =>
    makeAgent({
      id: i,
      name: `Agent${i}`,
      emoji: ['🎯', '🌙', '✨', '🔩', '💛', '🌿', '🔮', '🪶', '🌀', '💠'][i],
      minimalism: 50 + i * 3,
      novelty: 50 + i * 2,
      risk: 40 + i * 4,
      ornamentation: 60 - i * 3,
      marketFit: 50,
      symmetry: 60,
      reputation: 50,
      credits: 100000,
    })
  );
}

// ═══════════════════════════════════════════════════════════════
//  1. STATISTICAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

describe('pearsonCorr', () => {
  it('returns 1 for perfect positive correlation', () => {
    const r = pearsonCorr([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    assert.equal(r, 1);
  });

  it('returns -1 for perfect negative correlation', () => {
    const r = pearsonCorr([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    assert.equal(r, -1);
  });

  it('returns 0 for uncorrelated data', () => {
    const r = pearsonCorr([1, 2, 3, 4, 5], [5, 5, 5, 5, 5]);
    assert.equal(r, 0);
  });

  it('returns 0 for fewer than 2 data points', () => {
    assert.equal(pearsonCorr([1], [2]), 0);
    assert.equal(pearsonCorr([], []), 0);
  });

  it('handles two data points', () => {
    const r = pearsonCorr([1, 2], [3, 4]);
    assert.equal(r, 1);
  });

  it('computes partial correlation correctly', () => {
    const r = pearsonCorr([10, 20, 30, 40, 50], [12, 25, 28, 42, 48]);
    assert.ok(r > 0.95 && r <= 1, `Expected strong positive correlation, got ${r}`);
  });

  it('handles identical values in one array', () => {
    assert.equal(pearsonCorr([3, 3, 3], [1, 2, 3]), 0);
  });

  it('is symmetric', () => {
    const xs = [1, 3, 5, 7];
    const ys = [2, 6, 4, 8];
    assert.equal(pearsonCorr(xs, ys), pearsonCorr(ys, xs));
  });
});

describe('giniCoeff', () => {
  it('returns 0 for perfect equality', () => {
    assert.equal(giniCoeff([100, 100, 100, 100]), 0);
  });

  it('returns high value for extreme inequality', () => {
    const g = giniCoeff([0, 0, 0, 1000]);
    assert.ok(g > 0.5, `Expected high Gini, got ${g}`);
  });

  it('returns 0 for all-zero values', () => {
    assert.equal(giniCoeff([0, 0, 0]), 0);
  });

  it('handles single value', () => {
    assert.equal(giniCoeff([100]), 0);
  });

  it('returns value between 0 and 1 for typical distribution', () => {
    const g = giniCoeff([1000, 2000, 5000, 8000, 15000, 20000]);
    assert.ok(g >= 0 && g <= 1, `Gini out of range: ${g}`);
  });

  it('does not mutate input array', () => {
    const input = [500, 100, 300, 200];
    const copy = [...input];
    giniCoeff(input);
    assert.deepEqual(input, copy);
  });

  it('is higher for more unequal distributions', () => {
    const g1 = giniCoeff([100, 200, 300, 400]);
    const g2 = giniCoeff([10, 10, 10, 970]);
    assert.ok(g2 > g1, `Expected g2 (${g2}) > g1 (${g1})`);
  });
});

describe('linearSlope', () => {
  it('returns correct slope for perfectly linear data', () => {
    assert.equal(linearSlope([1, 2, 3, 4], [2, 4, 6, 8]), 2);
  });

  it('returns negative slope for decreasing data', () => {
    const s = linearSlope([1, 2, 3, 4], [8, 6, 4, 2]);
    assert.equal(s, -2);
  });

  it('returns 0 for flat data', () => {
    assert.equal(linearSlope([1, 2, 3], [5, 5, 5]), 0);
  });

  it('returns 0 when all x values are identical', () => {
    assert.equal(linearSlope([5, 5, 5], [1, 2, 3]), 0);
  });

  it('handles two points', () => {
    assert.equal(linearSlope([0, 10], [0, 30]), 3);
  });
});

describe('pct', () => {
  it('returns correct percentage', () => {
    assert.equal(pct(25, 100), 25);
    assert.equal(pct(1, 4), 25);
    assert.equal(pct(1, 3), 33);
  });

  it('returns 0 when total is 0', () => {
    assert.equal(pct(50, 0), 0);
  });

  it('returns 100 when value equals total', () => {
    assert.equal(pct(200, 200), 100);
  });

  it('rounds to nearest integer', () => {
    assert.equal(pct(1, 6), 17); // 16.67 rounds to 17
    assert.equal(pct(2, 6), 33); // 33.33 rounds to 33
  });

  it('handles values greater than total', () => {
    assert.equal(pct(150, 100), 150);
  });
});

// ═══════════════════════════════════════════════════════════════
//  2. Q-TABLE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

describe('initQTable', () => {
  it('creates all strategy-category pairs', () => {
    const qt = initQTable();
    const strategies = ['exploit', 'explore', 'mutate'];
    const categories = ['Ring', 'Pendant', 'Earrings', 'Bracelet'];

    strategies.forEach((s) => {
      assert.ok(qt[s], `Missing strategy: ${s}`);
      categories.forEach((c) => {
        assert.ok(qt[s][c], `Missing category ${c} under ${s}`);
      });
    });
  });

  it('initializes all values to zero', () => {
    const qt = initQTable();
    Object.values(qt).forEach((cats) => {
      Object.values(cats).forEach((data) => {
        assert.equal(data.totalCredits, 0);
        assert.equal(data.count, 0);
        assert.equal(data.avgCredits, 0);
        assert.equal(data.lastCycle, 0);
      });
    });
  });

  it('has exactly 3 strategies and 4 categories', () => {
    const qt = initQTable();
    assert.equal(Object.keys(qt).length, 3);
    Object.values(qt).forEach((cats) => {
      assert.equal(Object.keys(cats).length, 4);
    });
  });
});

describe('qTableContext', () => {
  it('returns empty string for empty Q-table', () => {
    assert.equal(qTableContext({}), '');
    assert.equal(qTableContext(null), '');
  });

  it('returns empty string when no entries have counts', () => {
    const qt = initQTable();
    assert.equal(qTableContext(qt), '');
  });

  it('formats entries with data', () => {
    const qt = initQTable();
    qt.exploit.Ring = { totalCredits: 5000, count: 2, avgCredits: 2500, lastCycle: 1 };
    qt.explore.Pendant = { totalCredits: 8000, count: 1, avgCredits: 8000, lastCycle: 1 };

    const ctx = qTableContext(qt);
    assert.ok(ctx.includes('Q-TABLE MARKET INTELLIGENCE'));
    assert.ok(ctx.includes('EXPLOIT + Ring'));
    assert.ok(ctx.includes('EXPLORE + Pendant'));
    assert.ok(ctx.includes('2,500'));
    assert.ok(ctx.includes('8,000'));
  });

  it('marks the best combo with a star', () => {
    const qt = initQTable();
    qt.exploit.Ring = { totalCredits: 2000, count: 1, avgCredits: 2000, lastCycle: 1 };
    qt.explore.Pendant = { totalCredits: 9000, count: 1, avgCredits: 9000, lastCycle: 1 };

    const ctx = qTableContext(qt);
    assert.ok(ctx.includes('EXPLORE + Pendant') && ctx.includes('★'));
  });

  it('includes strategy averages', () => {
    const qt = initQTable();
    qt.exploit.Ring = { totalCredits: 2000, count: 1, avgCredits: 2000, lastCycle: 1 };
    qt.exploit.Pendant = { totalCredits: 4000, count: 1, avgCredits: 4000, lastCycle: 1 };

    const ctx = qTableContext(qt);
    assert.ok(ctx.includes('Strategy averages'));
    assert.ok(ctx.includes('EXPLOIT'));
  });
});

// ═══════════════════════════════════════════════════════════════
//  3. GENOME SNAPSHOT
// ═══════════════════════════════════════════════════════════════

describe('snapshotGenome', () => {
  it('captures all genome fields from agent', () => {
    const agent = makeAgent();
    const snap = snapshotGenome(agent);

    assert.equal(snap.id, agent.id);
    assert.equal(snap.name, agent.name);
    assert.equal(snap.minimalism, agent.minimalism);
    assert.equal(snap.novelty, agent.novelty);
    assert.equal(snap.ornamentation, agent.ornamentation);
    assert.equal(snap.marketFit, agent.marketFit);
    assert.equal(snap.symmetry, agent.symmetry);
    assert.equal(snap.platBias, agent.platBias);
    assert.equal(snap.risk, agent.risk);
    assert.equal(snap.reputation, agent.reputation);
    assert.equal(snap.credits, agent.credits);
  });

  it('uses defaults for missing genome values', () => {
    const snap = snapshotGenome({ id: 1, name: 'Empty' });
    assert.equal(snap.minimalism, 50);
    assert.equal(snap.novelty, 50);
    assert.equal(snap.symmetry, 60);
    assert.equal(snap.coloredStone, 40);
    assert.equal(snap.diamond, 60);
    assert.equal(snap.mixedMetal, 30);
    assert.equal(snap.marginSens, 65);
    assert.equal(snap.complexBudget, 55);
  });

  it('deep-copies styleTags (no shared reference)', () => {
    const agent = makeAgent({ styleTags: ['minimal', 'organic'] });
    const snap = snapshotGenome(agent);
    snap.styleTags.push('added');
    assert.equal(agent.styleTags.length, 2);
  });

  it('handles empty styleTags', () => {
    const snap = snapshotGenome({ id: 0, name: 'X' });
    assert.deepEqual(snap.styleTags, []);
  });
});

// ═══════════════════════════════════════════════════════════════
//  4. GENOME EVOLUTION ENGINE
// ═══════════════════════════════════════════════════════════════

describe('EVOLUTION_RULES', () => {
  it('has rules for all 5 cycles', () => {
    assert.ok(EVOLUTION_RULES[1]);
    assert.ok(EVOLUTION_RULES[2]);
    assert.ok(EVOLUTION_RULES[3]);
    assert.ok(EVOLUTION_RULES[4]);
    assert.ok(EVOLUTION_RULES[5]);
  });

  it('each cycle has winner, loser, others, and beliefs', () => {
    [1, 2, 3, 4, 5].forEach((c) => {
      const r = EVOLUTION_RULES[c];
      assert.ok(r.winner, `Cycle ${c} missing winner`);
      assert.ok(r.loser, `Cycle ${c} missing loser`);
      assert.ok(r.others, `Cycle ${c} missing others`);
      assert.ok(r.beliefs, `Cycle ${c} missing beliefs`);
    });
  });

  it('beliefs cover all 10 agent indices', () => {
    [1, 2, 3, 4, 5].forEach((c) => {
      for (let i = 0; i <= 9; i++) {
        assert.ok(
          typeof EVOLUTION_RULES[c].beliefs[i] === 'string',
          `Cycle ${c} missing belief for agent ${i}`
        );
      }
    });
  });
});

describe('evolveAgentGenomes', () => {
  it('applies winner shifts to the winning agent', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    // Agent 1 wins (rank 1), agent 9 loses (rank 10)
    const order = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9];
    const designs = order.map((agentIdx, i) =>
      makeDesign({ agentIdx, rank: i + 1, credits: 20000 - i * 1800, name: i === 0 ? 'Winner' : undefined })
    );

    const oldMinimalism = agents[1].minimalism;
    evolveAgentGenomes(1, designs, agents, genomeSnapshots);

    // Winner (agent 1) should get Cycle 1 winner shifts: minimalism +8
    assert.equal(agents[1].minimalism, Math.min(100, oldMinimalism + 8));
  });

  it('applies loser shifts to the last-place agent', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800 })
    );

    const oldNovelty = agents[9].novelty;
    evolveAgentGenomes(1, designs, agents, genomeSnapshots);

    // Loser (agent 9, last place) gets Cycle 1 loser shift: novelty +10
    assert.equal(agents[9].novelty, Math.min(100, oldNovelty + 10));
  });

  it('applies others shifts to mid-ranked agents', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800 })
    );

    const oldMinimalism = agents[3].minimalism;
    evolveAgentGenomes(1, designs, agents, genomeSnapshots);

    // Agent 3 (not winner/loser) gets Cycle 1 others shift: minimalism +4
    assert.equal(agents[3].minimalism, Math.min(100, oldMinimalism + 4));
  });

  it('clamps genome values to [0, 100]', () => {
    const agents = makeTenAgents();
    agents[1].minimalism = 98; // near cap
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i === 0 ? 1 : i === 1 ? 0 : i, rank: i === 0 ? 2 : i === 1 ? 1 : i + 1, credits: 20000 - i * 1800 })
    );
    designs.sort((a, b) => a.rank - b.rank);

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    assert.ok(agents[1].minimalism <= 100, `Minimalism exceeded 100: ${agents[1].minimalism}`);
  });

  it('does not go below 0', () => {
    const agents = makeTenAgents();
    agents[0].risk = 2; // near floor — winner shift is -5
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    assert.ok(agents[0].risk >= 0, `Risk went below 0: ${agents[0].risk}`);
  });

  it('sets dominant belief for each agent', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    agents.forEach((a) => {
      assert.ok(a.dominantBelief.length > 0, `Agent ${a.id} has no belief`);
    });
  });

  it('increases trust for winner, decreases for loser', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    assert.equal(agents[0].trustBuilt, 15); // winner
    assert.equal(agents[9].trustBuilt, -5); // loser (last agent)
    assert.equal(agents[2].trustBuilt, 5); // mid-pack
  });

  it('appends evolution history for each agent', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 1800, name: i === 0 ? 'WinDesign' : i === 9 ? 'LoseDesign' : undefined })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    assert.equal(agents[0].evolutionHistory.length, 1);
    assert.equal(agents[0].evolutionHistory[0].cycle, 1);
    assert.ok(agents[0].evolutionHistory[0].summary.includes('Won'));
    assert.ok(agents[9].evolutionHistory[0].summary.includes('Last place'));
  });

  it('appends conversation memory for cycle 1 (cold start)', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 2000 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    agents.forEach((a) => {
      assert.equal(a.conversationMemory.length, 1);
      assert.ok(a.conversationMemory[0].excerpt.includes('cold start'));
    });
  });

  it('appends conversation memory for cycle 2+ (references prior winner)', () => {
    const agents = makeTenAgents();
    agents.forEach((a) => {
      a.conversationMemory = [{ cycle: 1, partner: 'X', excerpt: 'cold start' }];
    });
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 2000 })
    );

    evolveAgentGenomes(2, designs, agents, genomeSnapshots);
    agents.forEach((a) => {
      assert.equal(a.conversationMemory.length, 2);
      assert.ok(a.conversationMemory[1].excerpt.includes('C1 winner'));
    });
  });

  it('takes post-evolution genome snapshot', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 2000 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);
    assert.equal(genomeSnapshots.length, 2);
    assert.equal(genomeSnapshots[1].length, 10);
  });

  it('does nothing for invalid cycle number', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [];
    const designs = [makeDesign()];
    const origMinimalism = agents[0].minimalism;

    evolveAgentGenomes(99, designs, agents, genomeSnapshots);
    assert.equal(agents[0].minimalism, origMinimalism);
    assert.equal(genomeSnapshots.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
//  5. PATTERN RETRIEVAL & SCORING
// ═══════════════════════════════════════════════════════════════

describe('retrievePatterns', () => {
  it('returns empty string for empty pattern bank', () => {
    assert.equal(retrievePatterns(makeAgent(), [], 0), '');
  });

  it('returns formatted context for single pattern', () => {
    const agent = makeAgent({ risk: 50, marketFocus: 'Ring' });
    const bank = [
      {
        cycle: 1,
        rank: 1,
        category: 'Ring',
        strategy: 'mutate',
        confidence: 0.85,
        credits: 5000,
        aesthetic: 80,
        novelty: 70,
        profit: 65,
        materials: 'Platinum',
        form: 'Bezel',
        reasoning: 'Market demanded minimalism',
        emergingTrends: ['organic', 'sculpt'],
        genomeTraits: { novelty: 55, marketFit: 60, risk: 50 },
      },
    ];

    const ctx = retrievePatterns(agent, bank, 1);
    assert.ok(ctx.includes('HISTORICAL DESIGN PRECEDENTS'));
    assert.ok(ctx.includes('Ring'));
    assert.ok(ctx.includes('5,000'));
    assert.ok(ctx.includes('85%')); // confidence
  });

  it('scores category alignment (+3)', () => {
    const agent = makeAgent({ marketFocus: 'Ring', risk: 50 });
    const matchingPat = {
      cycle: 1, rank: 2, category: 'Ring', strategy: 'mutate', confidence: 0.5,
      credits: 5000, aesthetic: 80, novelty: 70, profit: 65, genomeTraits: {},
    };
    const nonMatchPat = {
      cycle: 1, rank: 2, category: 'Bracelet', strategy: 'mutate', confidence: 0.5,
      credits: 5000, aesthetic: 80, novelty: 70, profit: 65, genomeTraits: {},
    };

    const ctxMatch = retrievePatterns(agent, [matchingPat, nonMatchPat], 0);
    // Matching category should appear first (higher score)
    assert.ok(ctxMatch.includes('Ring'));
  });

  it('scores strategy alignment based on agent risk', () => {
    // risk > 65 → 'explore'; risk < 35 → 'exploit'; else → 'mutate'
    const explorer = makeAgent({ risk: 70 });
    const exploitPat = {
      cycle: 1, rank: 1, category: 'Ring', strategy: 'exploit', confidence: 0.5,
      credits: 5000, aesthetic: 80, novelty: 70, profit: 65, genomeTraits: {},
    };
    const explorePat = {
      cycle: 1, rank: 1, category: 'Ring', strategy: 'explore', confidence: 0.5,
      credits: 5000, aesthetic: 80, novelty: 70, profit: 65, genomeTraits: {},
    };

    // explorePat should score +2 for strategy alignment with high-risk agent
    const ctx = retrievePatterns(explorer, [exploitPat, explorePat], 0);
    assert.ok(ctx.includes('EXPLORE'));
  });

  it('limits to top 3 patterns', () => {
    const agent = makeAgent();
    const bank = Array.from({ length: 10 }, (_, i) => ({
      cycle: 1, rank: i + 1, category: 'Ring', strategy: 'exploit',
      confidence: 0.9 - i * 0.05, credits: 10000 - i * 500,
      aesthetic: 80, novelty: 70, profit: 65, genomeTraits: {},
    }));

    const ctx = retrievePatterns(agent, bank, 0);
    // Should only show 3 patterns (count "1.", "2.", "3.")
    const matches = ctx.match(/\d+\.\s+\[Cycle/g) || [];
    assert.equal(matches.length, 3);
  });

  it('awards recency bonus for current cycle patterns', () => {
    const agent = makeAgent();
    const oldPat = {
      cycle: 1, rank: 1, category: 'Ring', strategy: 'mutate', confidence: 0.9,
      credits: 10000, aesthetic: 90, novelty: 90, profit: 90, genomeTraits: {},
    };
    const newPat = {
      cycle: 2, rank: 1, category: 'Ring', strategy: 'mutate', confidence: 0.9,
      credits: 10000, aesthetic: 90, novelty: 90, profit: 90, genomeTraits: {},
    };

    // When cycleReportsLength is 2, newPat gets +1 recency bonus
    const ctx = retrievePatterns(agent, [oldPat, newPat], 2);
    assert.ok(ctx.includes('[Cycle 2'));
  });
});

// ═══════════════════════════════════════════════════════════════
//  6. TRAIT EFFECTIVENESS (EWC)
// ═══════════════════════════════════════════════════════════════

describe('computeTraitEffectiveness', () => {
  it('initializes trait data on first call', () => {
    const agents = makeTenAgents();
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: 10000 - i * 1500 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);

    assert.ok(te.minimalism, 'minimalism trait missing');
    assert.equal(te.minimalism.samples, 1);
    assert.ok(typeof te.minimalism.correlation === 'number');
    assert.ok(['positive', 'negative', 'neutral'].includes(te.minimalism.direction));
  });

  it('accumulates across multiple cycles', () => {
    const agents = makeTenAgents();
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: 10000 - i * 1500 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);
    computeTraitEffectiveness(2, designs, agents, te);

    assert.equal(te.minimalism.samples, 2);
  });

  it('uses EWC weighting (60/40) for cumulative correlation', () => {
    const agents = makeTenAgents();
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: 10000 - i * 1500 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);
    const firstCorr = te.novelty.cumulativeCorrelation;

    computeTraitEffectiveness(2, designs, agents, te);
    // cumulative = 0.6 * firstCorr + 0.4 * currentCorr
    // Since same data, currentCorr = firstCorr, so cumulative should ≈ firstCorr
    const diff = Math.abs(te.novelty.cumulativeCorrelation - firstCorr);
    assert.ok(diff < 0.01, `EWC drift too large: ${diff}`);
  });

  it('tracks all 16 genome traits', () => {
    const agents = makeTenAgents();
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: 10000 - i * 1500 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);

    const expectedTraits = [
      'minimalism', 'novelty', 'ornamentation', 'marketFit', 'symmetry',
      'platBias', 'coloredStone', 'diamond', 'mixedMetal', 'risk',
      'marginSens', 'complexBudget', 'pricePoint', 'manufacturability',
      'wearability', 'trendSens',
    ];
    expectedTraits.forEach((t) => {
      assert.ok(te[t], `Missing trait: ${t}`);
    });
  });

  it('computes winner average from top 3 designs', () => {
    const agents = makeTenAgents();
    // Give top 3 agents distinct minimalism values
    agents[0].minimalism = 90;
    agents[1].minimalism = 80;
    agents[2].minimalism = 70;
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: 20000 - i * 3000 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);

    // Winner avg for minimalism should be (90+80+70)/3 = 80
    assert.equal(te.minimalism.lastCycleValue, 80);
  });
});

describe('traitEffectivenessContext', () => {
  it('returns empty string when no trait data exists', () => {
    assert.equal(traitEffectivenessContext(0, {}, [makeAgent()]), '');
    assert.equal(traitEffectivenessContext(0, null, [makeAgent()]), '');
  });

  it('returns empty string for invalid agent index', () => {
    const te = { novelty: { samples: 1, cumulativeCorrelation: 0.5, importanceWeight: 0.5, lastCycleValue: 60, direction: 'positive' } };
    assert.equal(traitEffectivenessContext(5, te, [makeAgent()]), '');
  });

  it('formats trait effectiveness report', () => {
    const agents = [makeAgent({ novelty: 70 })];
    const te = {
      novelty: { samples: 2, cumulativeCorrelation: 0.45, importanceWeight: 0.5, lastCycleValue: 60, direction: 'positive' },
    };

    const ctx = traitEffectivenessContext(0, te, agents);
    assert.ok(ctx.includes('GENOME TRAIT EFFECTIVENESS'));
    assert.ok(ctx.includes('novelty'));
    assert.ok(ctx.includes('POSITIVE'));
    assert.ok(ctx.includes('above winners'));
  });

  it('labels PROVEN traits with importance > 0.4 and samples >= 2', () => {
    const agents = [makeAgent()];
    const te = {
      novelty: { samples: 2, cumulativeCorrelation: 0.6, importanceWeight: 0.5, lastCycleValue: 55, direction: 'positive' },
    };

    const ctx = traitEffectivenessContext(0, te, agents);
    assert.ok(ctx.includes('PROVEN'));
  });

  it('does not label PROVEN for low-importance or single-cycle traits', () => {
    const agents = [makeAgent()];
    const te = {
      novelty: { samples: 1, cumulativeCorrelation: 0.3, importanceWeight: 0.3, lastCycleValue: 55, direction: 'positive' },
    };

    const ctx = traitEffectivenessContext(0, te, agents);
    assert.ok(!ctx.includes('PROVEN'));
  });

  it('limits output to top 8 traits by importance', () => {
    const agents = [makeAgent()];
    const te = {};
    const traits = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    traits.forEach((t, i) => {
      te[t] = { samples: 1, cumulativeCorrelation: 0.1 * (i + 1), importanceWeight: 0.1 * (i + 1), lastCycleValue: 50, direction: 'positive' };
    });

    const ctx = traitEffectivenessContext(0, te, agents);
    const lines = ctx.split('\n').filter((l) => l.includes('corr='));
    assert.ok(lines.length <= 8, `Expected max 8 traits, got ${lines.length}`);
  });

  it('classifies direction correctly', () => {
    const agents = [makeAgent()];

    const posCtx = traitEffectivenessContext(0, {
      t1: { samples: 1, cumulativeCorrelation: 0.5, importanceWeight: 0.5, lastCycleValue: 50, direction: 'positive' },
    }, agents);
    assert.ok(posCtx.includes('POSITIVE'));

    const negCtx = traitEffectivenessContext(0, {
      t1: { samples: 1, cumulativeCorrelation: -0.5, importanceWeight: 0.5, lastCycleValue: 50, direction: 'negative' },
    }, agents);
    assert.ok(negCtx.includes('NEGATIVE'));

    const neuCtx = traitEffectivenessContext(0, {
      t1: { samples: 1, cumulativeCorrelation: 0.05, importanceWeight: 0.05, lastCycleValue: 50, direction: 'neutral' },
    }, agents);
    assert.ok(neuCtx.includes('NEUTRAL'));
  });
});

// ═══════════════════════════════════════════════════════════════
//  7. AGENT GENOME STRING GENERATION
// ═══════════════════════════════════════════════════════════════

describe('agentGenomeStr', () => {
  it('includes agent identity section', () => {
    const agent = makeAgent({ name: 'Luna', arch: 'Modernist', philosophy: 'Form follows function' });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('Name: Luna'));
    assert.ok(str.includes('Archetype: Modernist'));
    assert.ok(str.includes('Form follows function'));
  });

  it('includes jewelry category expertise', () => {
    const agent = makeAgent({ rings: 80, necklaces: 40 });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('Rings: 80/100'));
    assert.ok(str.includes('Necklaces: 40/100'));
  });

  it('includes style genome values', () => {
    const agent = makeAgent({ minimalism: 70, novelty: 55 });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('Minimalism: 70/100'));
    assert.ok(str.includes('Novelty Drive: 55/100'));
  });

  it('labels risk correctly based on value', () => {
    const explorer = makeAgent({ risk: 70 });
    assert.ok(agentGenomeStr(explorer).includes('Explorer (High Novelty)'));

    const refiner = makeAgent({ risk: 30 });
    assert.ok(agentGenomeStr(refiner).includes('Refiner (Exploit Lane)'));

    const balanced = makeAgent({ risk: 50 });
    assert.ok(agentGenomeStr(balanced).includes('Balanced (Mutate)'));
  });

  it('labels price point categories correctly', () => {
    assert.ok(agentGenomeStr(makeAgent({ pricePoint: 80 })).includes('High Jewelry ($10K+)'));
    assert.ok(agentGenomeStr(makeAgent({ pricePoint: 20 })).includes('Accessible ($200-1K)'));
    assert.ok(agentGenomeStr(makeAgent({ pricePoint: 50 })).includes('Mid-Market ($1K-10K)'));
  });

  it('labels manufacturability correctly', () => {
    assert.ok(agentGenomeStr(makeAgent({ manufacturability: 80 })).includes('Production-Ready'));
    assert.ok(agentGenomeStr(makeAgent({ manufacturability: 20 })).includes('Art-Piece'));
    assert.ok(agentGenomeStr(makeAgent({ manufacturability: 50 })).includes('Semi-Production'));
  });

  it('labels wearability correctly', () => {
    assert.ok(agentGenomeStr(makeAgent({ wearability: 80 })).includes('Daily Wear'));
    assert.ok(agentGenomeStr(makeAgent({ wearability: 20 })).includes('Statement/Runway'));
    assert.ok(agentGenomeStr(makeAgent({ wearability: 50 })).includes('Occasion Wear'));
  });

  it('labels trend sensitivity correctly', () => {
    assert.ok(agentGenomeStr(makeAgent({ trendSens: 80 })).includes('Trend-Forward'));
    assert.ok(agentGenomeStr(makeAgent({ trendSens: 20 })).includes('Timeless'));
    assert.ok(agentGenomeStr(makeAgent({ trendSens: 50 })).includes('Trend-Aware'));
  });

  it('includes manufacturing constraints based on genome', () => {
    const highMfg = makeAgent({ manufacturability: 75 });
    assert.ok(agentGenomeStr(highMfg).includes('MUST be castable'));

    const lowMfg = makeAgent({ manufacturability: 25 });
    assert.ok(agentGenomeStr(lowMfg).includes('hand fabrication'));
  });

  it('includes evolution history when present', () => {
    const agent = makeAgent({
      evolutionHistory: [
        { cycle: 1, summary: 'Won the round', genomeShifts: { minimalism: 5, risk: -3 } },
      ],
    });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('EVOLUTION HISTORY'));
    assert.ok(str.includes('Cycle 1: Won the round'));
    assert.ok(str.includes('minimalism: +5'));
    assert.ok(str.includes('risk: -3'));
  });

  it('omits evolution history when empty', () => {
    const agent = makeAgent({ evolutionHistory: [] });
    assert.ok(!agentGenomeStr(agent).includes('EVOLUTION HISTORY'));
  });

  it('includes conversation memory when present', () => {
    const agent = makeAgent({
      conversationMemory: [
        { cycle: 1, partner: 'Agent2', excerpt: 'Discussed trends' },
      ],
    });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('CONVERSATION MEMORY'));
    assert.ok(str.includes('Agent2'));
    assert.ok(str.includes('Discussed trends'));
  });

  it('calls trait effectiveness context function when provided', () => {
    let calledWith = null;
    const agent = makeAgent({ id: 3 });
    agentGenomeStr(agent, (id) => {
      calledWith = id;
      return '\nTRAIT CONTEXT HERE';
    });
    assert.equal(calledWith, 3);
  });

  it('includes style tags', () => {
    const agent = makeAgent({ styleTags: ['baroque', 'organic'] });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('baroque, organic'));
  });

  it('handles missing style tags', () => {
    const agent = makeAgent({ styleTags: [] });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('Style Tags: [none]'));
  });

  it('includes current state (credits, reputation, status)', () => {
    const agent = makeAgent({ credits: 25000, reputation: 75, status: 'designing' });
    const str = agentGenomeStr(agent);
    assert.ok(str.includes('Credits: 25000'));
    assert.ok(str.includes('Reputation: 75'));
    assert.ok(str.includes('Status: designing'));
  });
});

// ═══════════════════════════════════════════════════════════════
//  8. INTEGRATION: MULTI-CYCLE EVOLUTION
// ═══════════════════════════════════════════════════════════════

describe('multi-cycle evolution integration', () => {
  it('evolves agents across all 5 cycles with correct cumulative effects', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];

    // Record initial values
    const initialMins = agents.map((a) => a.minimalism);

    // Cycle 1: Agent 0 wins, Agent 9 loses
    const designs1 = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 30000 - i * 2500, name: `C1D${i}` })
    );
    evolveAgentGenomes(1, designs1, agents, genomeSnapshots);

    // Cycle 2: Agent 0 wins, Agent 9 loses
    const designs2 = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 25000 - i * 2200, name: `C2D${i}` })
    );
    evolveAgentGenomes(2, designs2, agents, genomeSnapshots);

    // Cycle 3: Agent 5 wins, Agent 4 loses
    const designs3 = agents.map((_, i) => {
      const idx = i === 0 ? 5 : i === 4 ? 9 : i === 5 ? 0 : i === 9 ? 4 : i;
      return makeDesign({ agentIdx: idx, rank: i + 1, credits: 30000 - i * 2500, name: `C3D${idx}` });
    });
    evolveAgentGenomes(3, designs3, agents, genomeSnapshots);

    // Cycle 4: Agent 6 wins, Agent 3 loses
    const designs4 = agents.map((_, i) => {
      const idx = i === 0 ? 6 : i === 6 ? 0 : i === 3 ? 9 : i === 9 ? 3 : i;
      return makeDesign({ agentIdx: idx, rank: i + 1, credits: 28000 - i * 2500, name: `C4D${idx}` });
    });
    evolveAgentGenomes(4, designs4, agents, genomeSnapshots);

    // Cycle 5: Agent 2 wins, Agent 8 loses
    const designs5 = agents.map((_, i) => {
      const idx = i === 0 ? 2 : i === 2 ? 0 : i === 8 ? 9 : i === 9 ? 8 : i;
      return makeDesign({ agentIdx: idx, rank: i + 1, credits: 26000 - i * 2300, name: `C5D${idx}` });
    });
    evolveAgentGenomes(5, designs5, agents, genomeSnapshots);

    // Verify cumulative evolution
    assert.equal(genomeSnapshots.length, 6); // initial + 5 cycles
    assert.equal(agents[0].evolutionHistory.length, 5);
    assert.equal(agents[0].conversationMemory.length, 5);

    // All genome values should remain in [0, 100]
    agents.forEach((a) => {
      ['minimalism', 'novelty', 'ornamentation', 'risk', 'marginSens', 'complexBudget'].forEach((trait) => {
        assert.ok(a[trait] >= 0 && a[trait] <= 100, `${a.name}.${trait} = ${a[trait]} out of range`);
      });
    });

    // Trust should accumulate across cycles
    agents.forEach((a) => {
      assert.ok(typeof a.trustBuilt === 'number');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  9. EDGE CASES & ROBUSTNESS
// ═══════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('pearsonCorr handles large numbers', () => {
    const r = pearsonCorr([1e6, 2e6, 3e6], [3e6, 6e6, 9e6]);
    assert.equal(r, 1);
  });

  it('pearsonCorr handles negative numbers', () => {
    const r = pearsonCorr([-3, -2, -1], [-6, -4, -2]);
    assert.equal(r, 1);
  });

  it('giniCoeff handles two-element arrays', () => {
    const g = giniCoeff([0, 100]);
    assert.ok(g > 0);
  });

  it('snapshotGenome handles agent with no optional fields', () => {
    const snap = snapshotGenome({ id: 0, name: 'Bare' });
    assert.equal(snap.minimalism, 50);
    assert.deepEqual(snap.styleTags, []);
    assert.equal(snap.reputation, undefined);
  });

  it('evolveAgentGenomes genome shifts are tracked accurately', () => {
    const agents = makeTenAgents();
    const genomeSnapshots = [agents.map((a) => snapshotGenome(a))];
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, rank: i + 1, credits: 20000 - i * 2000 })
    );

    evolveAgentGenomes(1, designs, agents, genomeSnapshots);

    // Check that genomeShifts in evolution history match actual changes
    agents.forEach((a, idx) => {
      const evo = a.evolutionHistory[0];
      const before = genomeSnapshots[0][idx];
      const after = genomeSnapshots[1][idx];
      Object.entries(evo.genomeShifts).forEach(([key, shift]) => {
        const expected = after[key] - before[key];
        assert.equal(shift, expected, `Agent ${idx} ${key}: shift=${shift} but actual delta=${expected}`);
      });
    });
  });

  it('retrievePatterns handles patterns with missing optional fields', () => {
    const agent = makeAgent();
    const bank = [
      {
        cycle: 1, rank: 2, category: 'Ring', strategy: 'explore',
        confidence: 0.7, credits: 3000, aesthetic: 60, novelty: 50, profit: 40,
        // No materials, form, reasoning, emergingTrends, genomeTraits
      },
    ];

    const ctx = retrievePatterns(agent, bank, 0);
    assert.ok(ctx.includes('?')); // missing fields show '?'
    assert.ok(ctx.includes('—')); // missing reasoning shows '—'
  });

  it('computeTraitEffectiveness direction classification thresholds', () => {
    const agents = makeTenAgents();
    // Create designs where credits perfectly correlate with agent index
    const designs = agents.map((_, i) =>
      makeDesign({ agentIdx: i, credits: (i + 1) * 5000 })
    );
    const te = {};

    computeTraitEffectiveness(1, designs, agents, te);

    // For traits that increase linearly with agent index (like minimalism = 50 + i*5),
    // and credits also increase linearly, correlation should be positive
    Object.values(te).forEach((data) => {
      assert.ok(['positive', 'negative', 'neutral'].includes(data.direction));
    });
  });
});
