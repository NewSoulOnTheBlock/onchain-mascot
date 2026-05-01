const { Connection, PublicKey, Transaction } = require("@solana/web3.js");
const { PumpAgent } = require("@pump-fun/agent-payments-sdk");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const userWallet = body.user;
    if (!userWallet || typeof userWallet !== "string") {
      res.status(400).json({ error: "missing user wallet" });
      return;
    }

    const rpcUrl = process.env.SOLANA_RPC_URL;
    const agentMintStr = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const currencyMintStr = process.env.CURRENCY_MINT;
    const priceAmount = Number(process.env.PRICE_AMOUNT);
    if (!rpcUrl || !agentMintStr || !currencyMintStr || !priceAmount) {
      res.status(500).json({ error: "server not configured" });
      return;
    }
    if (!(priceAmount > 0)) {
      res.status(500).json({ error: "invalid price" });
      return;
    }

    const userPublicKey = new PublicKey(userWallet);
    const agentMint = new PublicKey(agentMintStr);
    const currencyMint = new PublicKey(currencyMintStr);

    const memo = Math.floor(Math.random() * 900000000000) + 100000;
    const now = Math.floor(Date.now() / 1000);
    const startTime = now;
    const endTime = now + 86400;
    if (!(endTime > startTime)) {
      res.status(500).json({ error: "invalid time window" });
      return;
    }

    const connection = new Connection(rpcUrl, "confirmed");
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const instructions = await agent.buildAcceptPaymentInstructions({
      user: userPublicKey,
      currencyMint,
      amount: priceAmount,
      memo,
      startTime,
      endTime,
    });

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPublicKey;
    tx.add(...instructions);

    const serializedTx = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    res.status(200).json({
      transaction: serializedTx,
      amount: priceAmount,
      memo,
      startTime,
      endTime,
    });
  } catch (e) {
    console.error("rng-invoice error:", e?.message || e);
    res.status(500).json({ error: "failed to build invoice", detail: String(e?.message || e) });
  }
};
