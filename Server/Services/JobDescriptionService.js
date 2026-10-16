const TRANSLATION_URL = "https://api.mymemory.translated.net/get";
const MAX_QUERY_BYTES = 450;
const MAX_CACHED_DESCRIPTIONS = 500;
const translatedDescriptions = new Map();

const htmlEntities = {
  amp: "&",
  apos: "'",
  bull: "•",
  gt: ">",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

export const cleanJobDescription = (description) => {
  if (typeof description !== "string" || !description.trim()) return "";

  return description
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(
      /<\/(?:p|div|h[1-6]|tr|section|article|ul|ol|blockquote)\s*>/gi,
      "\n"
    )
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);?/gi, (entity, value) => {
      if (value[0] === "#") {
        const codePoint = value[1].toLowerCase() === "x"
          ? Number.parseInt(value.slice(2), 16)
          : Number.parseInt(value.slice(1), 10);

        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return entity;
        }
      }

      return htmlEntities[value.toLowerCase()] || entity;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const splitIntoChunks = (text) => {
  const chunks = [];
  let chunk = "";

  for (const token of text.match(/\s+|[^\s]+/gu) || []) {
    if (Buffer.byteLength(token, "utf8") > MAX_QUERY_BYTES) {
      if (chunk.trim()) chunks.push(chunk.trim());
      chunk = "";

      let part = "";
      for (const character of token) {
        if (
          part &&
          Buffer.byteLength(part + character, "utf8") > MAX_QUERY_BYTES
        ) {
          chunks.push(part);
          part = "";
        }
        part += character;
      }
      if (part) chunks.push(part);
      continue;
    }

    if (Buffer.byteLength(chunk + token, "utf8") > MAX_QUERY_BYTES) {
      if (chunk.trim()) chunks.push(chunk.trim());
      chunk = token.trimStart();
    }
    else {
      chunk += token;
    }
  }

  if (chunk.trim()) chunks.push(chunk.trim());
  return chunks;
};

const translateChunk = async (chunk) => {
  const url = new URL(TRANSLATION_URL);
  url.searchParams.set("q", chunk);
  url.searchParams.set("langpair", "autodetect|en");

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Translation service returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  const translatedText = result.responseData?.translatedText;

  if (
    result.responseStatus !== 200 ||
    result.quotaFinished ||
    typeof translatedText !== "string" ||
    !translatedText.trim()
  ) {
    throw new Error(
      result.responseDetails || "Translation service could not translate the description."
    );
  }

  return translatedText;
};

export const translateJobDescription = async (description) => {
  const cleaned = cleanJobDescription(description);
  if (!cleaned) return "";

  const cached = translatedDescriptions.get(cleaned);
  if (cached) return cached;

  const translatedParagraphs = [];
  for (const paragraph of cleaned.split(/\n{2,}/)) {
    const chunks = splitIntoChunks(paragraph);
    const translatedChunks = [];
    for (const chunk of chunks) {
      translatedChunks.push(await translateChunk(chunk));
    }
    translatedParagraphs.push(translatedChunks.join(" "));
  }

  const result = translatedParagraphs.join("\n\n").trim();
  if (translatedDescriptions.size >= MAX_CACHED_DESCRIPTIONS) {
    translatedDescriptions.delete(translatedDescriptions.keys().next().value);
  }
  translatedDescriptions.set(cleaned, result);
  return result;
};
