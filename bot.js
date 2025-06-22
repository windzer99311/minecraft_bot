const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let bot = null;
let botLaunched = false;
let reconnectInterval = null;
let botStatus = "🟡 Starting...";

// ---- MINEFLAYER BOT LOGIC ----

function launchBot() {
  if (botLaunched) return;

  console.log("🔁 Attempting to connect to server...");
  botStatus = "🔁 Connecting to Minecraft server...";

  bot = mineflayer.createBot({
    username: "minecraft_bot",
    host: "KARBAN2923-JmVS.aternos.me", // Your server address
    port: 51344,                        // Your server port
    version: "1.19.4",
    hideErrors: false
  });

  botLaunched = true;

  bot.on("login", () => {
    botStatus = "🟢 Connected to Minecraft server!";
    console.log(botStatus);
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  });

  bot.on("spawn", () => {
    const pos = bot.entity.position;
    bot.chat(`Bot spawned at: ${pos}`);
    bot.setControlState("forward", true);
    bot.setControlState("jump", true);
    bot.chat("🚶 Walking forward");
  });

  bot.on("end", (reason) => {
    botStatus = `🔴 Disconnected: ${reason}`;
    console.log(botStatus);
    botLaunched = false;
    tryReconnect();
  });

  bot.on("error", (err) => {
    botStatus = `❌ Error: ${err.message}`;
    console.error(botStatus);
    botLaunched = false;
    tryReconnect();
  });
}

function tryReconnect() {
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      if (!botLaunched) {
        console.log("🔁 Retrying to connect...");
        botStatus = "🔁 Retrying to connect...";
        launchBot();
      }
    }, 5000);
  }
}

launchBot();

// ---- SILENT DISCONNECT WATCHDOG ----

setInterval(() => {
  if (bot && botLaunched && bot._client?.ended) {
    console.log("⚠️ Silent bot end detected, restarting...");
    botStatus = "🔴 Bot silently disconnected. Reconnecting...";
    botLaunched = false;
    tryReconnect();
  }
}, 10000); // every 10 seconds

// ---- EXPRESS GUI ----

app.get('/', (req, res) => {
  const isConnected = botStatus.includes("🟢");
  const isError = botStatus.includes("❌") || botStatus.includes("🔴");
  const statusColor = isConnected ? "#00ff00" : (isError ? "#ff4444" : "#ffcc00");

  res.send(`
    <html>
      <head>
        <title>Minecraft Bot Status</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #121212;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .card {
            background: #1e1e1e;
            border: 2px solid ${statusColor};
            border-radius: 12px;
            padding: 30px 40px;
            box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
            text-align: center;
          }
          .status {
            font-size: 2rem;
            color: ${statusColor};
            margin-top: 10px;
          }
          h1 {
            font-size: 2.2rem;
            margin-bottom: 0;
          }
          small {
            color: #888;
            font-size: 0.8rem;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🛠 Minecraft Bot Status</h1>
          <div class="status">${botStatus}</div>
          <small>Auto-recovers from disconnects, including silent ones</small>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Web GUI available at http://localhost:${PORT}`);
});
