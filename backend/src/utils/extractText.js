const officeParser = require("officeparser");

const SUPPORTED_EXTENSIONS = ["pdf", "docx", "pptx", "txt"];

function getExtension(originalName) {
  return (originalName.split(".").pop() || "").toLowerCase();
}

// Returns plain extracted text for a supported file buffer.
// PDF/DOCX/PPTX go through officeparser (a single library that handles all
// three); TXT is read directly. Throws a descriptive error for anything else.
async function extractText(buffer, originalName) {
  const ext = getExtension(originalName);

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}. Allowed: ${SUPPORTED_EXTENSIONS.join(", ")}`);
  }

  if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  try {
    const text = await officeParser.parseOfficeAsync(buffer);
    return text || "";
  } catch (err) {
    throw new Error(`Could not extract text from this .${ext} file: ${err.message}`);
  }
}

module.exports = { extractText, SUPPORTED_EXTENSIONS, getExtension };
