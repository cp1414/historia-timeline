/**
 * Zero-dependency ranked & typo-tolerant search engine for the 160-plate
 * Historia Classical Timeline dataset.
 */

const FIELD_WEIGHTS = [
  { key: 'title', label: 'Title', exactWord: 140, prefixWord: 105, substring: 80, fuzzy: 45 },
  { key: 'date', label: 'Date', exactWord: 95, prefixWord: 72, substring: 55, fuzzy: 28 },
  { key: 'location', label: 'Location', exactWord: 85, prefixWord: 65, substring: 48, fuzzy: 25 },
  { key: 'reference', label: 'Source', exactWord: 70, prefixWord: 52, substring: 38, fuzzy: 18 },
  { key: 'artwork', label: 'Artwork', exactWord: 55, prefixWord: 40, substring: 28, fuzzy: 14 },
  { key: 'series', label: 'Wing', exactWord: 50, prefixWord: 36, substring: 24, fuzzy: 12 },
  { key: 'summary', label: 'Summary', exactWord: 35, prefixWord: 24, substring: 16, fuzzy: 8 }
];

const CARD_NUMBER_QUERY_RE = /^(?:card\s*)?#?0*(\d{1,3})$/;

/**
 * Normalizes diacritics, curly punctuation, dashes, and casing so ASCII queries
 * match typographic strings (e.g. "Moses' Birth", "49ers", "Cortes").
 */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .toLowerCase();
}

function stripApostrophes(text) {
  return text.replace(/'/g, '');
}

function tokenizeNormalized(normalized) {
  const compact = stripApostrophes(normalized);
  return compact.split(/[^a-z0-9]+/).filter(Boolean);
}

function createFieldEntry(rawText) {
  const text = normalizeSearchText(rawText);
  const compact = stripApostrophes(text);
  const words = tokenizeNormalized(text);
  return { text, compact, words };
}

function isAdjacentTransposition(a, b) {
  if (a.length !== b.length) return false;
  let firstDiff = -1;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      if (firstDiff !== -1) return false;
      if (i + 1 >= a.length || a[i] !== b[i + 1] || a[i + 1] !== b[i]) {
        return false;
      }
      firstDiff = i;
      i += 1;
    }
  }
  return firstDiff !== -1;
}

/**
 * Optimal string alignment (restricted Damerau-Levenshtein) bounded by maxDist.
 * Returns maxDist + 1 when the distance exceeds maxDist.
 */
export function damerauLevenshtein(a, b, maxDist = 2) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    let rowMin = maxDist + 1;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }

  return dp[m][n];
}

function getMaxEditDistance(token) {
  if (token.length <= 3) return 0;
  if (token.length <= 6) return 1;
  return 2;
}

function scoreFieldForToken(fieldEntry, token, compactToken, weights) {
  const { text, compact, words } = fieldEntry;
  if (!text) return 0;

  const wordToken = compactToken.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  let bestWordScore = 0;
  if (wordToken) {
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (word === wordToken) {
        return weights.exactWord;
      }
      if (word.startsWith(wordToken) && weights.prefixWord > bestWordScore) {
        bestWordScore = weights.prefixWord;
      }
    }
    if (bestWordScore > 0) return bestWordScore;
  }

  if (text.includes(token) || compact.includes(compactToken)) {
    return weights.substring;
  }

  const fuzzyTarget = wordToken || compactToken;
  const maxDist = getMaxEditDistance(fuzzyTarget);
  if (maxDist === 0) return 0;

  let bestDist = maxDist + 1;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    if (
      fuzzyTarget.length === 4 &&
      word[0] !== fuzzyTarget[0] &&
      !isAdjacentTransposition(fuzzyTarget, word)
    ) {
      continue;
    }
    const dist = damerauLevenshtein(fuzzyTarget, word, maxDist);
    if (dist < bestDist) {
      bestDist = dist;
      if (dist === 1) break;
    }
  }

  if (bestDist <= maxDist) {
    return Math.max(1, weights.fuzzy - (bestDist - 1) * 10);
  }
  return 0;
}

/**
 * Precomputes normalized search fields for all timeline events.
 */
export function buildEventSearchIndex(events) {
  const map = new Map();
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    const sortYearStr =
      typeof e.sortYear === 'number'
        ? e.sortYear < 0
          ? `${Math.abs(e.sortYear)} bc`
          : `${e.sortYear} ad`
        : '';
    const dateCombined = [e.dateDisplay, sortYearStr].filter(Boolean).join(' ');
    const locationCombined = e.location
      ? [e.location.name, e.location.region].filter(Boolean).join(' ')
      : '';
    const referenceCombined = [e.reference, e.scripturePassage, e.sourceName]
      .filter(Boolean)
      .join(' ');

    map.set(e.id, {
      event: e,
      title: createFieldEntry(e.title),
      date: createFieldEntry(dateCombined),
      location: createFieldEntry(locationCombined),
      reference: createFieldEntry(referenceCombined),
      artwork: createFieldEntry(e.artworkCredit),
      series: createFieldEntry(e.series),
      summary: createFieldEntry(e.summaryBack)
    });
  }
  return map;
}

/**
 * Filters and ranks timeline events for a given query and optional series wing.
 * Preserves chronological cardNumber order when query is empty.
 */
export function searchTimelineEvents(events, query, selectedSeries = 'all', indexMap = null) {
  const index = indexMap || buildEventSearchIndex(events);
  const scopedEvents =
    selectedSeries === 'all'
      ? events
      : events.filter((e) => e.seriesId === selectedSeries);

  const normalizedQuery = normalizeSearchText(query).trim();
  if (!normalizedQuery) {
    const sorted = [...scopedEvents].sort((a, b) => a.cardNumber - b.cardNumber);
    return {
      results: sorted.map((event) => ({ event, score: 0, matchLabel: null })),
      isQueryActive: false,
      totalInSeries: scopedEvents.length
    };
  }

  const cardNumMatch = normalizedQuery.match(CARD_NUMBER_QUERY_RE);
  const targetCardNumber = cardNumMatch ? parseInt(cardNumMatch[1], 10) : null;

  const rawTokens = normalizedQuery
    .split(/\s+/)
    .map((t) => t.replace(/^#/, ''))
    .filter(Boolean);

  if (rawTokens.length === 0) {
    const sorted = [...scopedEvents].sort((a, b) => a.cardNumber - b.cardNumber);
    return {
      results: sorted.map((event) => ({ event, score: 0, matchLabel: null })),
      isQueryActive: false,
      totalInSeries: scopedEvents.length
    };
  }

  const compactQuery = stripApostrophes(normalizedQuery);
  const results = [];

  for (let i = 0; i < scopedEvents.length; i += 1) {
    const ev = scopedEvents[i];
    const entry = index.get(ev.id);
    if (!entry) continue;

    if (targetCardNumber !== null && ev.cardNumber === targetCardNumber) {
      results.push({
        event: ev,
        score: 10000,
        matchLabel: 'Plate #'
      });
      continue;
    }

    let totalScore = 0;
    let allTokensMatched = true;
    let topFieldLabel = null;
    let topFieldScore = 0;

    for (let t = 0; t < rawTokens.length; t += 1) {
      const token = rawTokens[t];
      const compactToken = stripApostrophes(token);
      if (!compactToken) continue;

      let bestTokenScore = 0;
      let bestTokenField = null;

      for (let f = 0; f < FIELD_WEIGHTS.length; f += 1) {
        const fw = FIELD_WEIGHTS[f];
        const fieldScore = scoreFieldForToken(entry[fw.key], token, compactToken, fw);
        if (fieldScore > bestTokenScore) {
          bestTokenScore = fieldScore;
          bestTokenField = fw.label;
        }
      }

      if (bestTokenScore === 0) {
        allTokensMatched = false;
        break;
      }

      totalScore += bestTokenScore;
      if (bestTokenScore > topFieldScore) {
        topFieldScore = bestTokenScore;
        topFieldLabel = bestTokenField;
      }
    }

    if (!allTokensMatched) continue;

    if (rawTokens.length > 1) {
      if (entry.title.text.includes(normalizedQuery) || entry.title.compact.includes(compactQuery)) {
        totalScore += 120;
        topFieldLabel = 'Title';
      } else if (
        entry.location.text.includes(normalizedQuery) ||
        entry.date.text.includes(normalizedQuery)
      ) {
        totalScore += 60;
      }
    }

    results.push({
      event: ev,
      score: totalScore,
      matchLabel: topFieldLabel
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.event.cardNumber - b.event.cardNumber;
  });

  return {
    results,
    isQueryActive: true,
    totalInSeries: scopedEvents.length
  };
}
