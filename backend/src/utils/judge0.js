// Talks to a Judge0 CE instance (RapidAPI-hosted by default, or a
// self-hosted one via JUDGE0_API_URL). Uses submit-then-poll for both
// single runs and batches rather than relying on `wait=true` resolving
// within whatever timeout the host enforces — more reliable across hosts.

const JUDGE0_BASE_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 1000;

if (!process.env.JUDGE0_API_KEY) {
  console.warn(
    "[EduMind Pro AI] JUDGE0_API_KEY is not set — the Coding Playground will fail until you add it to backend/.env " +
      "(get a free RapidAPI key for 'Judge0 CE')."
  );
}

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
  }
  return headers;
}

function toBase64(str) {
  return Buffer.from(str ?? "", "utf-8").toString("base64");
}

function fromBase64(str) {
  return str ? Buffer.from(str, "base64").toString("utf-8") : "";
}

function formatResult(data) {
  return {
    stdout: fromBase64(data.stdout),
    stderr: fromBase64(data.stderr),
    compileOutput: fromBase64(data.compile_output),
    message: fromBase64(data.message),
    status: data.status?.description || "Unknown",
    time: data.time,
    memory: data.memory,
  };
}

async function runSubmission({ languageId, sourceCode, stdin }) {
  const submitRes = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      language_id: languageId,
      source_code: toBase64(sourceCode),
      stdin: toBase64(stdin || ""),
    }),
  });
  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => "");
    throw new Error(`Judge0 submit failed (${submitRes.status}): ${text}`);
  }
  const { token } = await submitRes.json();

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const pollRes = await fetch(`${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true`, {
      headers: getHeaders(),
    });
    if (!pollRes.ok) {
      const text = await pollRes.text().catch(() => "");
      throw new Error(`Judge0 poll failed (${pollRes.status}): ${text}`);
    }
    const data = await pollRes.json();
    // status.id: 1 = In Queue, 2 = Processing, 3+ = finished (accepted, error, etc.)
    if (data.status && data.status.id > 2) {
      return formatResult(data);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Judge0 took too long to return a result. Try again.");
}

async function runBatch({ languageId, sourceCode, testCases }) {
  const submissions = testCases.map((tc) => ({
    language_id: languageId,
    source_code: toBase64(sourceCode),
    stdin: toBase64(tc.input || ""),
  }));

  const submitRes = await fetch(`${JUDGE0_BASE_URL}/submissions/batch?base64_encoded=true`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ submissions }),
  });
  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => "");
    throw new Error(`Judge0 batch submit failed (${submitRes.status}): ${text}`);
  }
  const submitData = await submitRes.json();
  const tokens = submitData.map((s) => s.token).join(",");

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const pollRes = await fetch(`${JUDGE0_BASE_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true`, {
      headers: getHeaders(),
    });
    if (!pollRes.ok) {
      const text = await pollRes.text().catch(() => "");
      throw new Error(`Judge0 batch poll failed (${pollRes.status}): ${text}`);
    }
    const pollData = await pollRes.json();
    const results = pollData.submissions || pollData;
    const allDone = results.every((s) => s.status && s.status.id > 2);
    if (allDone) {
      return results.map(formatResult);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Judge0 took too long to return results. Try again.");
}

module.exports = { runSubmission, runBatch };
