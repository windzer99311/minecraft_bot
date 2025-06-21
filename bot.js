const mineflayer = require('mineflayer');

let bot = null;
let botLaunched = false;
let reconnectInterval = null;

function launchBot() {
  if (botLaunched) return; // already trying or connected

  console.log("🔁 Attempting to connect to server...");

  bot = mineflayer.createBot({
    username: "minecraft_bot",
    host: "localhost",   // <- change this to your server
    port: 3000,          // <- change this to your port
    version: "1.19.4",
    hideErrors: false
  });

  botLaunched = true;

  bot.on("login", () => {
    console.log("🟢 Connected to Minecraft server!");
    clearInterval(reconnectInterval); // stop reconnect attempts
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
