const TAVILY_URL = "https://api.tavily.com/search";

async function tavilySearch(query, maxResults = 5) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not set on the server.");
  }

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
}

module.exports = { tavilySearch };
