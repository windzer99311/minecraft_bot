const mineflayer = require('mineflayer');

let bot = null;
let botLaunched = false;
let reconnectInterval = null;

function launchBot() {
  if (botLaunched) return; // already trying or connected

  console.log("🔁 Attempting to connect to server...");

  bot = mineflayer.createBot({
    username: "minecaft_bot",
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

  bot.on("spawn", () => {
  const pos = bot.entity.position;
  bot.chat(`Bot spawned at: ${pos}`);
  });

  bot.on("chat", async (sender, message) => {
  if (!sender || sender === bot.username) return;

  const pos = bot.entity.position;

  if (message.includes("break")) {
    const blockPos = pos.offset(0, -1, 0);
    const block = bot.blockAt(blockPos);

    if (bot.canDigBlock(block)) {
      bot.chat(`Breaking ${block.name} at ${blockPos}`);
      try {
        await bot.dig(block);
      } catch (err) {
        bot.chat("Error digging block");
        console.error(err);
      }
    } else {
      bot.chat("Can't dig block");
    }

  } else if (message.includes("walk forward")) {
    bot.setControlState("forward", true);
    bot.chat("🚶 Walking forward");

  } else if (message.includes("stop walking")) {
    bot.setControlState("forward", false);
    bot.chat("⛔ Stopped walking");

  } else if (message.includes("bot position")) {
    bot.chat(`📍 Position: ${bot.entity.position}`);
  }
  });

  bot.on("chat", async (sender, message) => {
  if (!sender || sender === bot.username) return;

  if (message.includes("sleep")) {
    const bed = bot.findBlock({
      matching: block => block.name.includes("bed"),
      maxDistance: 6
    });

    if (!bed) {
      bot.chat("❌ No bed nearby!");
      return;
    }

    try {
      await bot.sleep(bed);
      bot.chat("😴 Sleeping...");
    } catch (err) {
      bot.chat("⚠️ Can't sleep: " + err.message);
    }
  }
  });
  bot.on("wake", () => {
  bot.chat("☀️ Woke up!");
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
