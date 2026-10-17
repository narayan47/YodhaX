import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const he = require("he");

const TRANSLATION_URL = "https://api.mymemory.translated.net/get";

const MAX_QUERY_BYTES = 450;
const MAX_CACHED_DESCRIPTIONS = 500;
const REQUEST_TIMEOUT_MS = 15000;

const translatedDescriptions = new Map();

/**
 * Move a cache entry to the newest position.
 * The Map also acts as a small LRU cache.
 */
function cacheGet(key) {
  if (!translatedDescriptions.has(key)) {
    return undefined;
  }

  const value = translatedDescriptions.get(key);

  translatedDescriptions.delete(key);
  translatedDescriptions.set(key, value);

  return value;
}

function cacheSet(key, value) {
  if (translatedDescriptions.has(key)) {
    translatedDescriptions.delete(key);
  }

  translatedDescriptions.set(key, value);

  while (translatedDescriptions.size > MAX_CACHED_DESCRIPTIONS) {
    const oldestKey = translatedDescriptions.keys().next().value;
    translatedDescriptions.delete(oldestKey);
  }
}

/**
 * Remove scripts, styles, HTML tags, and encoded HTML entities.
 * Keep paragraph and list boundaries so descriptions remain readable.
 */
export function cleanJobDescription(description = "") {
  if (description == null) {
    return "";
  }

  let text = String(description);

  // Remove scripts and styles before processing other markup.
  text = text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, " ");

  // Decode encoded tags, such as &lt;p&gt;.
  text = he.decode(text);

  // Preserve meaningful line breaks.
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/(?:p|div|li|h[1-6]|tr|section|article|ul|ol|blockquote)\s*>/gi,
      "\n"
    )
    .replace(/<(?:li|p|div|h[1-6])\b[^>]*>/gi, "");

  // Remove remaining HTML tags.
  text = text.replace(/<[^>]*>/g, " ");

  // Decode remaining entities, such as &amp;, &nbsp;, and &#39;.
  text = he.decode(text);

  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into chunks no larger than MAX_QUERY_BYTES,
 * measured in UTF-8 bytes rather than JavaScript characters.
 */
function splitIntoChunks(text, maxBytes = MAX_QUERY_BYTES) {
  const chunks = [];
  const encoder = new TextEncoder();

  let current = "";

  const byteLength = (value) => encoder.encode(value).length;

  // Process each paragraph separately when possible.
  const paragraphs = text.split(/\n+/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (!words.length) {
      continue;
    }

    for (const word of words) {
      if (byteLength(word) > maxBytes) {
        // Handle an unusually long individual word safely.
        if (current) {
          chunks.push(current);
          current = "";
        }

        let piece = "";

        for (const character of word) {
          if (byteLength(piece + character) > maxBytes) {
            if (piece) chunks.push(piece);
            piece = character;
          } else {
            piece += character;
          }
        }

        if (piece) {
          current = piece;
        }

        continue;
      }

      const candidate = current ? `${current} ${word}` : word;

      if (byteLength(candidate) > maxBytes) {
        if (current) chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
      current = "";
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Translate one plain-text chunk into English using MyMemory.
 */
async function translateChunkToEnglish(chunk) {
  const cleanChunk = chunk.trim();

  if (!cleanChunk) {
    return "";
  }

  if (new TextEncoder().encode(cleanChunk).length > MAX_QUERY_BYTES) {
    throw new Error("Translation chunk exceeds the byte limit.");
  }

  const url = new URL(TRANSLATION_URL);
  url.searchParams.set("q", cleanChunk);
  url.searchParams.set("langpair", "autodetect|en");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Translation API returned HTTP ${response.status}.`);
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(
      data.responseDetails || "Translation API could not translate the text."
    );
  }

  const translatedText = data.responseData?.translatedText;

  if (typeof translatedText !== "string" || !translatedText.trim()) {
    throw new Error("Translation API returned an empty translation.");
  }

  // MyMemory may return HTML entities in its response.
  return he.decode(translatedText).trim();
}

/**
 * Translate an entire job description into English.
 *
 * - Accepts plain text or HTML.
 * - Splits long descriptions into safe chunks.
 * - Caches successful translations.
 * - Preserves paragraphs.
 * - Falls back to readable original text on failure.
 */
export async function translateJobDescription(description = "") {
  const originalText = cleanJobDescription(description);

  if (!originalText) {
    return "";
  }

  const cached = cacheGet(originalText);

  if (cached !== undefined) {
    return cached;
  }

  const chunks = splitIntoChunks(originalText);
  const translatedChunks = [];

  try {
    for (const chunk of chunks) {
      const translated = await translateChunkToEnglish(chunk);
      translatedChunks.push(translated);
    }

    // Rejoin chunks with readable spacing and remove any markup
    // that the translation service may have returned.
    const translatedText = cleanJobDescription(
      translatedChunks.join("\n\n")
    );

    if (!translatedText) {
      throw new Error("The cleaned translation was empty.");
    }

    cacheSet(originalText, translatedText);

    return translatedText;
  } catch (error) {
    console.error(
      "Job description translation failed:",
      error.message
    );

    // Keep the job visible if the translation service is unavailable.
    // Return cleaned source text rather than raw HTML.
    return originalText;
  }
}
