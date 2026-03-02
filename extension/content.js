chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "scanPage") return;

  runScan(msg.payload)
    .then((leads) => sendResponse({ leads }))
    .catch(() => sendResponse({ leads: [] }));

  return true;
});

async function runScan(payload) {
  const keywordSets = payload?.keywordSets || [];
  const maxScrollRounds = Math.max(1, payload?.maxScrollRounds || 4);

  await autoScroll(maxScrollRounds);
  const posts = collectPostData();

  return posts
    .filter((post) => post.content && post.postUrl)
    .filter((post) => isMatched(post.content, keywordSets));
}

function collectPostData() {
  const articles = document.querySelectorAll('div[role="article"]');
  const leads = [];

  for (const article of articles) {
    const content = normalizeText(article.innerText || "");
    const author = extractAuthor(article);
    const postUrl = extractPostUrl(article);

    if (!content || !postUrl) continue;
    leads.push({ content, author, postUrl });
  }

  return dedupeByUrl(leads);
}

function extractAuthor(article) {
  const authorEl =
    article.querySelector('h2 a[role="link"]') ||
    article.querySelector('h3 a[role="link"]') ||
    article.querySelector('strong a[role="link"]');

  return normalizeText(authorEl?.textContent || "");
}

function extractPostUrl(article) {
  const anchors = article.querySelectorAll('a[href*="/groups/"]');
  for (const a of anchors) {
    const href = a.getAttribute("href") || "";
    if (href.includes("/posts/") || href.includes("permalink")) {
      return toAbsoluteFbUrl(href);
    }
  }
  return "";
}

function toAbsoluteFbUrl(href) {
  try {
    const abs = new URL(href, location.origin);
    abs.search = "";
    return abs.toString();
  } catch {
    return "";
  }
}

function isMatched(content, keywordSets) {
  if (!Array.isArray(keywordSets) || !keywordSets.length) return false;
  const normalized = normalizeText(content).toLowerCase();

  return keywordSets.some((set) => {
    if (!Array.isArray(set) || !set.length) return false;
    return set.every((kw) => normalized.includes(normalizeText(kw).toLowerCase()));
  });
}

async function autoScroll(rounds) {
  for (let i = 0; i < rounds; i++) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    await wait(2000 + Math.floor(Math.random() * 1500));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function dedupeByUrl(leads) {
  const map = new Map();
  for (const item of leads) {
    if (!map.has(item.postUrl)) {
      map.set(item.postUrl, item);
    }
  }
  return [...map.values()];
}

function normalizeText(input) {
  return (input || "").replace(/\s+/g, " ").trim();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
