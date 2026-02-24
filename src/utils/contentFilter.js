/**
 * Content filter for objectionable text (Apple Guideline 1.2 - filtering).
 * Blocks posts/comments containing listed phrases (case-insensitive).
 * Inspired by Instagram/TikTok community standards: hate speech, threats, abuse, explicit content.
 */
const BLOCKED_PHRASES = [
  // —— Threats / violence ——
  "kill yourself",
  "kys",
  "k y s",
  "go die",
  "go kill yourself",
  "hope you die",
  "i will kill you",
  "i'll kill you",
  "kill you",
  "murder you",
  "bomb you",
  "shoot you",
  "rape you",
  "i hope you die",
  "hang yourself",
  "go hang yourself",
  "off yourself",
  "unalive yourself",
  "commit suicide",
  "kill them",
  "kill her",
  "kill him",
  "bomb the",
  "shoot up",
  "terrorist attack",
  "bomb threat",
  // —— Hate speech / slurs (racial, ethnic, homophobic, ableist) ——
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "negro",
  "faggot",
  "fag",
  "fagg",
  "f@ggot",
  "f@g",
  "tranny",
  "trannie",
  "retard",
  "retarded",
  "r*tard",
  "r word",
  "nazi",
  "hitler",
  "heil hitler",
  "white power",
  "wp ",
  "black lives don't matter",
  "all whites",
  "kill all",
  "exterminate",
  "subhuman",
  "untermensch",
  "chink",
  "gook",
  "kike",
  "spic",
  "wetback",
  "paki",
  "gypsy",
  "gypsie",
  "terrorist",
  "islamist",
  // —— Sexual explicit / harassment ——
  "dick pic",
  "send nudes",
  "nude pic",
  "child porn",
  "cp ",
  "underage",
  "minor sex",
  "pedo",
  "pedophile",
  "paedophile",
  "lolicon",
  "shota",
  "incest",
  "rape",
  "rapist",
  "molest",
  "molestor",
  // —— Severe profanity / abuse (EN) ——
  "fuck you",
  "f u c k",
  "fck you",
  "fuk you",
  "motherfucker",
  "mofo",
  "mf ",
  "shit face",
  "piece of shit",
  "eat shit",
  "suck my",
  "suck my dick",
  "suck my cock",
  "blow me",
  "cunt",
  "whore",
  "slut",
  "bitch ass",
  "dumb bitch",
  "stupid bitch",
  // —— Turkish: küfür, hakaret, tehdit ——
  "amk",
  "amq",
  "aq",
  "orospu",
  "orospu çocuğu",
  "orospu cocugu",
  "göt",
  "got ver",
  "sik",
  "sikeyim",
  "sikerim",
  "siktir",
  "siktir git",
  "götveren",
  "gotveren",
  "piç",
  "pic",
  "puşt",
  "pusht",
  "ibne",
  "kahpe",
  "döl",
  "yarrak",
  "amına",
  "amina",
  "amuna",
  "götüne",
  "gotune",
  "sokayım",
  "sokayim",
  "ananı sikeyim",
  "babanı sikeyim",
  "öl",
  "geber",
  "geberesice",
  "öldüreyim",
  "öldürürüm",
  "sana tecavüz",
  "tecavüz",
  "pezevenk",
  "kerhane",
  "fahişe",
  "kahpe",
  "it oğlu it",
  "hayvan",
  "salak",
  "gerizekalı",
  "geri zekalı",
  "aptal orospu",
  "dangalak",
  "şerefsiz",
  "serefsiz",
  "namussuz",
  "alçak",
  "alçak herif",
  "kaltak",
  "sürtük",
  "surtuk",
  // —— Spam / scam ——
  "click here for free",
  "dm for price",
  "hit me up on telegram",
  "onlyfans",
  "only fans",
  "buy followers",
  "free followers",
  "cashapp",
  "paypal me",
  "send money to",
  "wire transfer",
  "crypto scam",
  // —— Self-harm promotion ——
  "cut yourself",
  "cutting is good",
  "how to suicide",
  "how to kill yourself",
  "best way to die",
];

/**
 * Normalize for matching: lowercase, collapse whitespace and common separators (Instagram-style evasion handling).
 */
function normalizeForMatch(str) {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/[\s._*\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escape special regex characters so phrase is matched literally.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns true if text contains any blocked phrase as whole word(s) (Instagram-style).
 * Uses word boundaries so "retard" does not match "retardation", "class" does not match "ass", etc.
 * @param {string} text - User-generated content to check
 * @returns {boolean}
 */
export function containsBlockedContent(text) {
  if (!text || typeof text !== "string") return false;
  const normalized = normalizeForMatch(text);
  if (!normalized) return false;

  for (const phrase of BLOCKED_PHRASES) {
    if (!phrase || typeof phrase !== "string") continue;
    const p = normalizeForMatch(phrase);
    if (!p) continue;

    // Word-boundary match: phrase must appear as whole word(s), not inside another word (Instagram-like)
    const escaped = escapeRegex(p);
    try {
      const re = new RegExp("\\b" + escaped + "\\b", "i");
      if (re.test(normalized)) return true;
    } catch (_) {
      // Fallback: simple substring if regex fails (e.g. special chars)
      if (normalized.includes(p)) return true;
    }
  }
  return false;
}
