export function initMusic() {
  const btn = document.getElementById("musicBtn");
  const audio = document.getElementById("bgm");
  if (!btn || !audio) return;
  audio.volume = 0.08;

  let want = localStorage.getItem("mascot_music") !== "off";
  let started = false;

  function render() {
    btn.textContent = audio.paused ? "🔇" : "🔊";
    btn.classList.toggle("playing", !audio.paused);
  }

  async function tryStart() {
    if (started || !want) return;
    try {
      await audio.play();
      started = true;
      render();
    } catch {}
  }

  document.addEventListener("click", tryStart, { once: false });

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (audio.paused) {
      want = true;
      localStorage.setItem("mascot_music", "on");
      try { await audio.play(); } catch {}
    } else {
      want = false;
      localStorage.setItem("mascot_music", "off");
      audio.pause();
    }
    render();
  });

  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  render();
}
