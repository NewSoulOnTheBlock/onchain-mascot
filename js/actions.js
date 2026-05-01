import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "https://esm.sh/@solana/web3.js@1.98.0";
import {
  MASCOT,
  RPC_URL,
  MEMO_PROGRAM_ID,
  ACTION_LAMPORTS,
  ACTION_TO_STAT,
} from "./config.js";
import { connect, getProvider, getPublicKey, isConnected } from "./wallet.js";
import { restoreStat } from "./stats.js";

const connection = new Connection(RPC_URL, "confirmed");
const memoProgram = new PublicKey(MEMO_PROGRAM_ID);

function todayUtcKey() {
  return new Date().toISOString().slice(0, 10);
}
function cdKey(wallet, action) {
  return `mascot_cd_${wallet}_${action}_${todayUtcKey()}`;
}
function isOnCooldown(wallet, action) {
  return !!localStorage.getItem(cdKey(wallet, action));
}
function setCooldown(wallet, action) {
  localStorage.setItem(cdKey(wallet, action), "1");
}

function fallbackUrl(action) {
  const base = `solana:${MASCOT.wallet}`;
  const params = new URLSearchParams({
    amount: (ACTION_LAMPORTS / 1e9).toString(),
    memo: action,
    label: MASCOT.name,
  });
  return `${base}?${params.toString()}`;
}

function markButtonDone(action) {
  const btn = document.querySelector(`.action[data-action="${action}"]`);
  if (!btn) return;
  btn.classList.add("done");
  btn.disabled = true;
  btn.querySelector("span").textContent = "✓ done";
}
function refreshButtonsForWallet() {
  const pk = getPublicKey();
  document.querySelectorAll(".action").forEach((btn) => {
    const action = btn.dataset.action;
    btn.classList.remove("done");
    btn.disabled = false;
    btn.querySelector("span").textContent = action;
    if (pk && isOnCooldown(pk.toString(), action)) markButtonDone(action);
  });
}

async function sendAction(action) {
  if (!isConnected()) {
    const pk = await connect({ silent: false });
    if (!pk) return;
  }
  const wallet = getPublicKey().toString();
  if (isOnCooldown(wallet, action)) return;

  const provider = getProvider();
  const fromPk = getPublicKey();
  const toPk = new PublicKey(MASCOT.wallet);

  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const tx = new Transaction({ feePayer: fromPk, blockhash, lastValidBlockHeight });
    tx.add(SystemProgram.transfer({ fromPubkey: fromPk, toPubkey: toPk, lamports: ACTION_LAMPORTS }));
    tx.add(
      new TransactionInstruction({
        keys: [],
        programId: memoProgram,
        data: new TextEncoder().encode(action),
      })
    );
    const { signature } = await provider.signAndSendTransaction(tx);
    setCooldown(wallet, action);
    markButtonDone(action);
    restoreStat(ACTION_TO_STAT[action]);
    console.log(`[${action}] sent`, signature);
  } catch (e) {
    console.warn(`[${action}] failed, opening Solana Pay fallback`, e);
    window.open(fallbackUrl(action), "_blank");
  }
}

export function initActions() {
  document.querySelectorAll(".action").forEach((btn) => {
    btn.addEventListener("click", () => sendAction(btn.dataset.action));
  });
  refreshButtonsForWallet();
  window.addEventListener("storage", refreshButtonsForWallet);
}

export function refreshActionButtons() {
  refreshButtonsForWallet();
}
