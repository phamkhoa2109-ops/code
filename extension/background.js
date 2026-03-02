const DEFAULT_CONFIG = {
  groupUrls: [],
  keywordSets: [],
  scanIntervalMin: 15,
  maxGroupsPerCycle: 5,
  maxScrollRounds: 4,
  telegramBotToken: "",
  telegramChatId: ""
};

const ALARM_NAME = "fb-group-lead-scan";

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["config"]);
  if (!stored.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG, leads: [], seenPostUrls: {} });
  }
  await scheduleAlarm();
});

chrome.runtime.onStartup.addListener(scheduleAlarm);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await scanAllGroups();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "manualScan") {
    scanAllGroups().then(
      () => sendResponse({ ok: true }),
      (err) => sendResponse({ ok: false, error: String(err) })
    );
    return true;
  }
  return false;
});

async function scheduleAlarm() {
  const { config } = await chrome.storage.local.get(["config"]);
  const interval = Math.max(5, config?.scanIntervalMin || DEFAULT_CONFIG.scanIntervalMin);
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: interval });
}

async function scanAllGroups() {
  const { config = DEFAULT_CONFIG, leads = [], seenPostUrls = {} } = await chrome.storage.local.get([
    "config",
    "leads",
    "seenPostUrls"
  ]);

  const groups = (config.groupUrls || []).slice(0, config.maxGroupsPerCycle || 5);
  if (!groups.length) return;

  for (const groupUrl of groups) {
    const delayMs = 2500 + Math.floor(Math.random() * 2500);
    await sleep(delayMs);

    const pageLeads = await scanSingleGroup(groupUrl, config).catch(() => []);
    for (const lead of pageLeads) {
      if (lead.postUrl && !seenPostUrls[lead.postUrl]) {
        seenPostUrls[lead.postUrl] = true;
        leads.unshift({ ...lead, foundAt: new Date().toISOString(), groupUrl });
        await maybeSendTelegram(lead, config);
      }
    }
  }

  await chrome.storage.local.set({
    leads: leads.slice(0, 300),
    seenPostUrls
  });
}

async function scanSingleGroup(groupUrl, config) {
  const tab = await chrome.tabs.create({ url: groupUrl, active: false });
  try {
    await waitForTabLoaded(tab.id);
    await sleep(2500);

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "scanPage",
      payload: {
        keywordSets: config.keywordSets || [],
        maxScrollRounds: config.maxScrollRounds || 4
      }
    });

    return response?.leads || [];
  } finally {
    if (tab?.id) {
      await chrome.tabs.remove(tab.id).catch(() => {});
    }
  }
}

function waitForTabLoaded(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function maybeSendTelegram(lead, config) {
  if (!config.telegramBotToken || !config.telegramChatId) return;

  const text = [
    "🎯 Lead mới từ Facebook Group",
    `👤 Người đăng: ${lead.author || "(không rõ)"}`,
    `📝 Nội dung: ${truncate(lead.content || "", 400)}`,
    `🔗 Link: ${lead.postUrl || "N/A"}`
  ].join("\n");

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      disable_web_page_preview: true
    })
  }).catch(() => {});
}

function truncate(input, max) {
  if (input.length <= max) return input;
  return `${input.slice(0, max)}...`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
