const mineflayer = require('mineflayer');

let bot = null;
let botLaunched = false;
let reconnectInterval = null;

function launchBot() {
  if (botLaunched) return; // already trying or connected

  console.log("🔁 Attempting to connect to server...");

  bot = mineflayer.createBot({
    username: "unnon",
    host: "KARBAN2923-JmVS.aternos.me",   // <- change this to your server
    port: 51344,          // <- change this to your port
    version: "1.19.4",
    hideErrors: false
  });

  botLaunched = true;

  bot.on("login", () => {
    console.log("🟢 Connected to Minecraft server!");
    clearInterval(reconnectInterval); // stop reconnect attempts
    reconnectInterval = null;
  });

  bot.on("end", (reason) => {
    console.log("🔴 Bot disconnected:", reason);
    botLaunched = false;
    tryReconnect();
  });

  bot.on("error", (err) => {
    console.error("❌ Bot error:", err.message);
    botLaunched = false;
    tryReconnect();
  });
}

function tryReconnect() {
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      if (!botLaunched) {
        console.log("🔁 Retrying to connect...");
        launchBot();
      }
    }, 5000); // retry every 5 seconds
  }
}

launchBot(); // start immediately
