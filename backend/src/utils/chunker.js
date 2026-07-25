// Simple recursive-style character chunker: fixed-size windows with overlap
// so context isn't lost at chunk boundaries. Good enough for study notes,
// papers, and slide decks without pulling in a full LangChain dependency.
function chunkText(text, chunkSize = 800, overlap = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.trim().length > 20); // drop near-empty tail chunks
}

module.exports = { chunkText };
