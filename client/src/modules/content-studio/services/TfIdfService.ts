/**
 * TF-IDF Service
 *
 * Computes Term Frequency - Inverse Document Frequency vectors
 * for transcript segments. Used for keyword extraction, bigram detection,
 * and building similarity matrices for TextRank.
 *
 * Architecture decision: Ships a basic English IDF approximation where
 * the top 500 common words get low IDF and the rest get neutral IDF.
 * This avoids needing an external corpus while still downweighting stopwords.
 */

import type { TfIdfVector, ScoredKeyword } from '../types';

// ─── Common English Words (top ~500 by frequency) ────────────────────────────
// These receive low IDF scores to reduce their influence

const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has',
  'had', 'did', 'does', 'am', 'being', 'having', 'doing', 'would', 'should',
  'could', 'might', 'must', 'shall', 'may', 'need', 'dare', 'ought', 'used',
  'going', 'got', 'getting', 'made', 'making', 'said', 'went', 'going',
  'thing', 'things', 'lot', 'lots', 'very', 'really', 'much', 'more', 'most',
  'many', 'few', 'less', 'little', 'still', 'own', 'such', 'same', 'both',
  'each', 'every', 'between', 'through', 'before', 'during', 'without',
  'again', 'too', 'here', 'where', 'why', 'how', 'while', 'since', 'until',
  'always', 'never', 'often', 'sometimes', 'usually', 'already', 'yet',
  'quite', 'rather', 'rather', 'however', 'therefore', 'hence', 'thus',
  'also', 'another', 'those', 'done', 'part', 'long', 'great', 'small',
  'large', 'high', 'old', 'different', 'big', 'important', 'right', 'left',
  'last', 'next', 'early', 'young', 'sure', 'better', 'best', 'free',
  'true', 'whole', 'real', 'able', 'possible', 'likely', 'certain',
  'open', 'close', 'clear', 'full', 'else', 'keep', 'let', 'begin',
  'seem', 'help', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe',
  'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose',
  'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead',
  'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read',
  'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember',
  'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
  'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain',
  'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide',
  'pull', 'develop', 'become', 'actually', 'probably', 'perhaps', 'maybe',
  'kind', 'sort', 'something', 'nothing', 'everything', 'anything',
  'someone', 'everyone', 'anyone', 'nobody', 'himself', 'herself',
  'itself', 'themselves', 'myself', 'yourself', 'ourselves', 'what',
  'which', 'whose', 'whom', 'been', 'being', 'have', 'has', 'had',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
  'do', 'does', 'did', 'am', 'is', 'are', 'was', 'were', 'the',
  'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'along',
  'around', 'among', 'off', 'down', 'out', 'over', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'because', 'as', 'until', 'while', 'although',
  'though', 'whether', 'if', 'that', 'what', 'which', 'who', 'whom',
  'this', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them',
  'his', 'her', 'their', 'my', 'your', 'our', 'we', 'you', 'me', 'us',
  'okay', 'yeah', 'yes', 'no', 'oh', 'uh', 'um', 'like', 'well', 'right',
  'know', 'mean', 'gonna', 'wanna', 'gotta', 'kinda', 'sorta',
]);

/** Low IDF for common words */
const LOW_IDF = 0.1;

/** Neutral IDF for non-common words */
const NEUTRAL_IDF = 2.5;

/** High IDF for rare terms (appearing in <10% of documents) */
const HIGH_IDF = 4.0;

/**
 * Tokenize text into lowercase words, removing punctuation
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^\d+$/.test(w));
}

/**
 * Compute term frequency for a list of tokens
 */
function computeTf(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }
  // Normalize by total tokens
  const total = tokens.length || 1;
  const tf: Record<string, number> = {};
  for (const [term, count] of Object.entries(freq)) {
    tf[term] = count / total;
  }
  return tf;
}

/**
 * Get IDF score for a term using the approximation model
 *
 * @param term - The term to score
 * @param documentFrequency - Optional map of term to number of documents containing it
 * @param totalDocuments - Total number of documents
 */
function getIdf(
  term: string,
  documentFrequency?: Record<string, number>,
  totalDocuments?: number
): number {
  // If we have actual document frequency data, use it
  if (documentFrequency && totalDocuments && documentFrequency[term] !== undefined) {
    const df = documentFrequency[term];
    if (df === 0) return HIGH_IDF;
    return Math.log(totalDocuments / df) + 1;
  }

  // Otherwise use the approximation
  if (COMMON_WORDS.has(term)) {
    return LOW_IDF;
  }
  return NEUTRAL_IDF;
}

/**
 * Compute TF-IDF vector for a single document
 */
export function computeTfIdfVector(
  tokens: string[],
  documentFrequency?: Record<string, number>,
  totalDocuments?: number
): TfIdfVector {
  const tf = computeTf(tokens);
  const terms: Record<string, number> = {};

  for (const [term, tfValue] of Object.entries(tf)) {
    const idf = getIdf(term, documentFrequency, totalDocuments);
    terms[term] = tfValue * idf;
  }

  return { terms };
}

/**
 * Compute document frequency from a corpus of token arrays
 */
export function computeDocumentFrequency(corpus: string[][]): Record<string, number> {
  const df: Record<string, number> = {};
  for (const doc of corpus) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      df[term] = (df[term] || 0) + 1;
    }
  }
  return df;
}

/**
 * Extract bigrams from tokens
 */
export function extractBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i]!;
    const b = tokens[i + 1]!;
    // Skip bigrams with common words on both sides
    if (!COMMON_WORDS.has(a) || !COMMON_WORDS.has(b)) {
      bigrams.push(`${a} ${b}`);
    }
  }
  return bigrams;
}

/**
 * Extract top keywords from a TF-IDF vector
 *
 * @param vector - The TF-IDF vector
 * @param topN - Number of top keywords to return
 * @param tokens - Original tokens for frequency counting
 */
export function extractKeywords(
  vector: TfIdfVector,
  topN: number,
  tokens: string[]
): ScoredKeyword[] {
  // Count raw frequencies
  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  const entries = Object.entries(vector.terms)
    .filter(([term]) => !COMMON_WORDS.has(term) && term.length > 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  return entries.map(([term, score]) => ({
    term,
    score,
    frequency: freq[term] || 0,
  }));
}

/**
 * Extract keywords including bigrams
 */
export function extractKeywordsWithBigrams(
  texts: string[],
  topN: number = 20
): ScoredKeyword[] {
  // Tokenize all texts
  const allTokens = texts.flatMap(tokenize);
  const bigrams = extractBigrams(allTokens);

  // Compute TF-IDF for unigrams
  const unigramVector = computeTfIdfVector(allTokens);
  const unigramKeywords = extractKeywords(unigramVector, topN, allTokens);

  // Compute TF-IDF for bigrams (treat each bigram as a token)
  const bigramFreq: Record<string, number> = {};
  for (const bg of bigrams) {
    bigramFreq[bg] = (bigramFreq[bg] || 0) + 1;
  }

  const totalBigrams = bigrams.length || 1;
  const bigramKeywords: ScoredKeyword[] = Object.entries(bigramFreq)
    .map(([term, count]) => ({
      term,
      score: (count / totalBigrams) * NEUTRAL_IDF,
      frequency: count,
    }))
    .filter((k) => k.frequency >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.floor(topN / 2));

  // Merge and sort
  return [...unigramKeywords, ...bigramKeywords]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Compute cosine similarity between two TF-IDF vectors
 */
export function cosineSimilarity(a: TfIdfVector, b: TfIdfVector): number {
  const allTerms = new Set([...Object.keys(a.terms), ...Object.keys(b.terms)]);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const term of allTerms) {
    const va = a.terms[term] || 0;
    const vb = b.terms[term] || 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
