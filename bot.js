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
    username: "minecraft_bot",
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
