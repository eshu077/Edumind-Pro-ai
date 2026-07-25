// Decides whether a user message needs fresh, real-world information (→ Tavily)
// or can be answered from the model's own knowledge (→ Groq directly).
// Keyword-based on purpose: fast, free, and predictable. If this starts
// misrouting on real usage, swap it for a tiny Groq classification call.
const FRESHNESS_PATTERN =
  /\b(latest|recent(ly)?|today|todays|tonight|current(ly)?|this (week|month|year)|breaking|news|update[sd]?|new (version|release)|just (released|announced|launched)|right now|as of (now|today)|202[4-9])\b/i;

function decideProvider(message) {
  return FRESHNESS_PATTERN.test(message) ? "tavily" : "groq";
}

module.exports = { decideProvider };
