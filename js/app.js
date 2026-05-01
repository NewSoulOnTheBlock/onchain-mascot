import { startClocks } from "./clocks.js";
import { initWalletUi, onWallet } from "./wallet.js";
import { initActions, refreshActionButtons } from "./actions.js";
import { startStatLoop } from "./stats.js";
import { startRpcLoop, refreshFromChain } from "./rpc.js";
import { startCostLoop } from "./cost.js";
import { initTrollbox } from "./trollbox.js";
import { initMusic } from "./music.js";
import { initChat } from "./chat.js";
import { initRng } from "./rng.js";

startClocks();
initWalletUi();
initActions();
startStatLoop();
startRpcLoop();
startCostLoop();
initMusic();
initChat();
initRng();
initTrollbox().catch((e) => console.warn("trollbox init failed", e));

// nudge bg video to play if autoplay was blocked
const bgv = document.getElementById("bgVideo");
if (bgv) {
  const tryPlay = () => bgv.play().catch(() => {});
  tryPlay();
  document.addEventListener("click", tryPlay, { once: true });
  document.addEventListener("touchstart", tryPlay, { once: true });
}

onWallet("connected", () => {
  refreshActionButtons();
  refreshFromChain();
});
onWallet("disconnected", () => refreshActionButtons());
