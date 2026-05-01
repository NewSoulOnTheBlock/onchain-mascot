const history = [];

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function append(role, text) {
  const log = document.getElementById("chatLog");
  if (!log) return;
  const li = document.createElement("li");
  li.className = `chat-msg chat-${role}`;
  const who = role === "user" ? "you" : "$";
  li.innerHTML = `<span class="who">${who}</span><span class="bubble">${escapeHtml(text)}</span>`;
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
}

async function send(text) {
  append("user", text);
  history.push({ role: "user", content: text });

  const log = document.getElementById("chatLog");
  const thinking = document.createElement("li");
  thinking.className = "chat-msg chat-assistant chat-thinking";
  thinking.innerHTML = `<span class="who">taki</span><span class="bubble">…</span>`;
  log.appendChild(thinking);
  log.scrollTop = log.scrollHeight;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(-10) }),
    });
    thinking.remove();
    if (!r.ok) {
      append("assistant", "wallet's heavy, brain's lagging. try again.");
      return;
    }
    const j = await r.json();
    const reply = j?.reply ?? "...";
    history.push({ role: "assistant", content: reply });
    append("assistant", reply);
  } catch (e) {
    thinking.remove();
    append("assistant", "rpc froze. retry.");
  }
}

export function initChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim().slice(0, 500);
    if (!text) return;
    input.value = "";
    send(text);
  });

  append("assistant", "yo.");
}
