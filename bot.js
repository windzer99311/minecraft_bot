const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let bot = null;
let botLaunched = false;
let reconnectInterval = null;
let botStatus = "starting...";

// ---- MINEFLAYER BOT LOGIC ----

function launchBot() {
  if (botLaunched) return;

  console.log("🔁 Attempting to connect...");

  bot = mineflayer.createBot({
    username: "non",
    host: "KARBAN2923-JmVS.aternos.me",
    port: 51344,
    version: "1.19.4",
    hideErrors: false
  });

  botLaunched = true;

  bot.on("login", () => {
    botStatus = "🟢 Connected";
    console.log(botStatus);
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  });

  bot.on("end", (reason) => {
    botStatus = `🔴 Disconnected: ${reason}`;
    console.log(botStatus);
    botLaunched = false;
    tryReconnect();
  });

  bot.on("error", (err) => {
    botStatus = `❌ Error: ${err.message}`;
    console.log(botStatus);
    botLaunched = false;
    tryReconnect();
  });
}

function tryReconnect() {
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      if (!botLaunched) launchBot();
    }, 5000);
  }
}

launchBot();

// ---- EXPRESS SERVER ----

app.get('/', (req, res) => {
  res.send(`<h1>Minecraft Bot Status</h1><p>${botStatus}</p>`);
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on http://localhost:${PORT}`);
});
