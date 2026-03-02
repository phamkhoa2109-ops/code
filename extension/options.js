const DEFAULT_CONFIG = {
  groupUrls: [],
  keywordSets: [],
  scanIntervalMin: 15,
  maxGroupsPerCycle: 5,
  maxScrollRounds: 4,
  telegramBotToken: "",
  telegramChatId: ""
};

const ids = {
  groupUrls: document.getElementById("groupUrls"),
  keywordSets: document.getElementById("keywordSets"),
  scanIntervalMin: document.getElementById("scanIntervalMin"),
  maxGroupsPerCycle: document.getElementById("maxGroupsPerCycle"),
  maxScrollRounds: document.getElementById("maxScrollRounds"),
  telegramBotToken: document.getElementById("telegramBotToken"),
  telegramChatId: document.getElementById("telegramChatId"),
  saveBtn: document.getElementById("saveBtn"),
  status: document.getElementById("status")
};

init();
ids.saveBtn.addEventListener("click", save);

async function init() {
  const { config = DEFAULT_CONFIG } = await chrome.storage.local.get(["config"]);
  ids.groupUrls.value = (config.groupUrls || []).join("\n");
  ids.keywordSets.value = (config.keywordSets || []).map((item) => item.join("|")) .join("\n");
  ids.scanIntervalMin.value = config.scanIntervalMin || 15;
  ids.maxGroupsPerCycle.value = config.maxGroupsPerCycle || 5;
  ids.maxScrollRounds.value = config.maxScrollRounds || 4;
  ids.telegramBotToken.value = config.telegramBotToken || "";
  ids.telegramChatId.value = config.telegramChatId || "";
}

async function save() {
  const config = {
    groupUrls: parseLines(ids.groupUrls.value),
    keywordSets: parseKeywordSets(ids.keywordSets.value),
    scanIntervalMin: Number(ids.scanIntervalMin.value) || 15,
    maxGroupsPerCycle: Number(ids.maxGroupsPerCycle.value) || 5,
    maxScrollRounds: Number(ids.maxScrollRounds.value) || 4,
    telegramBotToken: ids.telegramBotToken.value.trim(),
    telegramChatId: ids.telegramChatId.value.trim()
  };

  await chrome.storage.local.set({ config });
  ids.status.textContent = "Đã lưu cấu hình. Extension sẽ dùng cấu hình mới từ chu kỳ tiếp theo.";
  setTimeout(() => (ids.status.textContent = ""), 2500);
}

function parseLines(input) {
  return input
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseKeywordSets(input) {
  return parseLines(input).map((line) =>
    line
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}
