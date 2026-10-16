const TRANSLATION_URL =
  "https://api.mymemory.translated.net/get";

const MAX_QUERY_BYTES = 450;
const MAX_CACHED_DESCRIPTIONS = 500;

const cache = new Map();

const entities = {
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

export function cleanJobDescription(description) {
  if (
    typeof description !== "string" ||
    !description.trim()
  ) {
    return "";
  }

  return description
    .replace(
      /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      " "
    )
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(
      /<\/?(?:p|div|h[1-6]|tr|section|article|ul|ol|blockquote)\b[^>]*>/gi,
      "\n"
    )
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(#x[\da-f]+|#\d+|[a-z]+);?/gi,
      (entity, value) => {
        if (value[0] === "#") {
          const code =
            value[1].toLowerCase() === "x"
              ? Number.parseInt(value.slice(2), 16)
              : Number.parseInt(value.slice(1), 10);

          try {
            return String.fromCodePoint(code);
          } catch {
            return entity;
          }
        }

        return entities[value.toLowerCase()] ?? entity;
      }
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoChunks(input) {
  const chunks = [];
  let current = "";

  const tokens = input.match(/\s+|[^\s]+/gu) || [];

  for (const token of tokens) {
    if (
      Buffer.byteLength(token, "utf8") >
      MAX_QUERY_BYTES
    ) {
      if (current.trim()) {
        chunks.push(current.trim());
      }

      current = "";

      let part = "";

      for (const char of token) {
        if (
          part &&
          Buffer.byteLength(
            part + char,
            "utf8"
          ) > MAX_QUERY_BYTES
        ) {
          chunks.push(part);
          part = "";
        }

        part += char;
      }

      if (part) {
        chunks.push(part);
      }
    } else if (
      Buffer.byteLength(
        current + token,
        "utf8"
      ) > MAX_QUERY_BYTES
    ) {
      if (current.trim()) {
        chunks.push(current.trim());
      }

      current = token.trimStart();
    } else {
      current += token;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

async function translateChunk(chunk) {
  const url = new URL(TRANSLATION_URL);

  url.searchParams.set("q", chunk);
  url.searchParams.set(
    "langpair",
    "autodetect|en"
  );

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Translation service returned HTTP ${response.status}.`
    );
  }

  const data = await response.json();

  const translated =
    data.responseData?.translatedText;

  if (
    data.responseStatus !== 200 ||
    typeof translated !== "string" ||
    !translated.trim()
  ) {
    throw new Error(
      data.responseDetails ||
        "Translation service could not translate the description."
    );
  }

  return translated;
}

export async function translateJobDescription(
  description
) {
  const cleaned = cleanJobDescription(description);

  if (!cleaned) {
    return "";
  }

  if (cache.has(cleaned)) {
    return cache.get(cleaned);
  }

  const paragraphs = [];

  for (const paragraph of cleaned.split(/\n{2,}/)) {
    const translated = [];

    for (const chunk of splitIntoChunks(paragraph)) {
      translated.push(
        await translateChunk(chunk)
      );
    }

    paragraphs.push(translated.join(" "));
  }

  const result = paragraphs.join("\n\n").trim();

  if (cache.size >= MAX_CACHED_DESCRIPTIONS) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(cleaned, result);

  return result;
}