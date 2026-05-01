export const MASCOT = {
  name: "mf taki tiger",
  shortName: "taki",
  tagline: "moneymaxxing apex plush",
  birthUtc: "2026-05-01T11:37:46Z",
  lifespanYears: 10,
  wallet: "49hca5vrJ3ca1T2hEAiHa61HCRRw8E7AsxJMsoU8xVGo",
  tokenMint: "REPLACE_WITH_TOKEN_MINT",
};

export const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=bd2136fd-c7bd-46ac-9f3e-78c9a3c71d46";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const ACTION_LAMPORTS = 100_000;

export const STAT_DECAY_PER_TICK = 0.1;
export const STAT_TICK_MS = 10_000;
export const STAT_FLOOR = 20;
export const STAT_CAP = 100;
export const STAT_RESTORE_AMOUNT = 10;

export const RPC_REFRESH_MS = 60_000;
export const PRICE_REFRESH_MS = 5 * 60_000;

export const TROLLBOX_PEERS = ["https://gun-manhattan.herokuapp.com/gun"];
export const TROLLBOX_NAMESPACE = "mascot-trollbox-v1";
export const TROLLBOX_HISTORY_HOURS = 24;
export const TROLLBOX_MAX_MESSAGES = 100;

export const ACTION_TO_STAT = {
  feed: "health",
  hug: "happy",
  play: "active",
  talk: "social",
};
