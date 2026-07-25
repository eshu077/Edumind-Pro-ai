// Embeddings run locally via transformers.js (ONNX runtime under the hood),
// not through a paid API. The model (~90MB) downloads once on first use and
// is cached under node_modules/.cache — first request after a fresh install
// or deploy will be slower while it downloads.
let embedderPromise = null;

async function getEmbedder() {
  if (!embedderPromise) {
    const { pipeline } = await import("@xenova/transformers");
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function embedBatch(texts) {
  const embedder = await getEmbedder();
  const vectors = [];
  for (const text of texts) {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(output.data));
  }
  return vectors;
}

// Vectors from this model are already L2-normalized, so a plain dot product
// equals cosine similarity — no need to divide by magnitudes.
function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

module.exports = { embedText, embedBatch, cosineSimilarity };
