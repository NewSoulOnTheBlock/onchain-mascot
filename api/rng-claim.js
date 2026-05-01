const { Connection, PublicKey } = require("@solana/web3.js");
const { PumpAgent } = require("@pump-fun/agent-payments-sdk");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const userWallet = body.user;
    const amount = Number(body.amount);
    const memo = Number(body.memo);
    const startTime = Number(body.startTime);
    const endTime = Number(body.endTime);

    if (
      !userWallet ||
      !Number.isFinite(amount) ||
      !Number.isFinite(memo) ||
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      !(amount > 0) ||
      !(endTime > startTime)
    ) {
      res.status(400).json({ error: "invalid invoice params" });
      return;
    }

    const rpcUrl = process.env.SOLANA_RPC_URL;
    const agentMintStr = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const currencyMintStr = process.env.CURRENCY_MINT;
    if (!rpcUrl || !agentMintStr || !currencyMintStr) {
      res.status(500).json({ error: "server not configured" });
      return;
    }

    const userPublicKey = new PublicKey(userWallet);
    const agentMint = new PublicKey(agentMintStr);
    const currencyMint = new PublicKey(currencyMintStr);

    const connection = new Connection(rpcUrl, "confirmed");
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    let paid = false;
    for (let i = 0; i < 6; i++) {
      try {
        paid = await agent.validateInvoicePayment({
          user: userPublicKey,
          currencyMint,
          amount,
          memo,
          startTime,
          endTime,
        });
      } catch (e) {
        console.warn("validate attempt failed:", e?.message || e);
      }
      if (paid) break;
      await sleep(2000);
    }

    if (!paid) {
      res.status(402).json({ ok: false, error: "payment not verified" });
      return;
    }

    const number = Math.floor(Math.random() * 1001);
    res.status(200).json({ ok: true, number });
  } catch (e) {
    console.error("rng-claim error:", e?.message || e);
    res.status(500).json({ error: "claim failed", detail: String(e?.message || e) });
  }
};
