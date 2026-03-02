const leadList = document.getElementById("leadList");
document.getElementById("scanBtn").addEventListener("click", triggerScan);
document.getElementById("openOptionsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());

init();

async function init() {
  const { leads = [] } = await chrome.storage.local.get(["leads"]);
  render(leads.slice(0, 20));
}

async function triggerScan() {
  const response = await chrome.runtime.sendMessage({ type: "manualScan" });
  if (!response?.ok) {
    alert("Quét thất bại. Hãy mở tab Facebook đã đăng nhập rồi thử lại.");
  }
  await init();
}

function render(items) {
  leadList.innerHTML = "";
  if (!items.length) {
    leadList.innerHTML = "<li>Chưa có kết quả.</li>";
    return;
  }

  for (const lead of items) {
    const li = document.createElement("li");
    li.className = "lead-item";
    li.innerHTML = `
      <div><strong>${escapeHtml(lead.author || "(Không rõ tên)")}</strong></div>
      <div>${escapeHtml((lead.content || "").slice(0, 120))}</div>
      <div><a href="${lead.postUrl}" target="_blank">Mở bài viết</a></div>
    `;
    leadList.appendChild(li);
  }
}

function escapeHtml(input) {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}
