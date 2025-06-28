const mineflayer = require('mineflayer')
const Vec3 = require('vec3')
const express = require('express')
const radius = 9
let isSleeping = false
let walkInterval = null
let botStatus = '🔄 Starting...'
let a = 0;
let new_op = '';
let old_op = '';
let bot
let center = null
let game_bot='Wanderot'
// === Express GUI Server ===
const app = express()
const guiPort = 3001
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bot Status</title>
        <meta http-equiv="refresh" content="2">
        <style>
          body { font-family: Arial; text-align: center; margin-top: 100px; background: #f0f0f0; }
          h1 { color: #333; }
          .status { font-size: 2em; color: #222; }
        </style>
      </head>
      <body>
        <h1>🤖 WanderBot Status</h1>
        <div class="status">${botStatus}</div>
      </body>
    </html>
  `)
})

app.listen(guiPort, () => {
  console.log(`🌐 GUI running at http://localhost:${guiPort}`)
})


function bot_name() {
     a += 1;
     b= a-1;
     new_op = 'bot_' + a;
     old_op = 'bot_' + b;
     console.log(new_op)
     console.log(old_op)
    }
function bot_2(){
    bot = mineflayer.createBot({
    host: 'KARBAN2923-JmVS.aternos.me',
    port: 51344,
    username: `${old_op}`
    })

   bot.once('spawn', () => {
   console.log(`connected ${new_op} as operator!`)
   bot.chat(`/op ${new_op}`)
   console.log("New operator join the game!")
   setTimeout(() => {
   console.log('waiting!');
    }, 1000); // 3 seconds
    bot.chat(`/pardon ${game_bot}`)
    console.log("Unban Bot successfully!!")
   setTimeout(() => {
    console.log('waiting!');
    }, 1000); // 3 seconds
   console.log("Old operator removed!");
   bot.chat('Hello Everyone,I Unban Our Bot!!')
   bot.chat('My Work is Done,bye.Have a Nice Day!!')
   setTimeout(() => {
    console.log('Done!!');
    }, 2000);
   bot.quit("Goodbye!")
  })

  bot.on('end', () => {
  console.log(`former Operator ${old_op} left the game!`)
  createBot()
  })
  }

// === Bot Creation ===
function createBot() {
  bot = mineflayer.createBot({
    host: 'KARBAN2923-JmVS.aternos.me',
    port: 51344,
    username: `${game_bot}`
  })

  function isWithinBounds(pos) {
    if (!center) return false
    return (
      Math.abs(pos.x - center.x) <= radius &&
      Math.abs(pos.z - center.z) <= radius
    )
  }

  function randomDirection() {
    const directions = [
      { x: 1, z: 0 }, { x: -1, z: 0 },
      { x: 0, z: 1 }, { x: 0, z: -1 },
      { x: 1, z: 1 }, { x: -1, z: -1 },
      { x: 1, z: -1 }, { x: -1, z: 1 }
    ]
    return directions[Math.floor(Math.random() * directions.length)]
  }

  function stopCurrentWalk() {
    bot.setControlState('forward', false)
    if (walkInterval) clearInterval(walkInterval)
    walkInterval = null
  }

  function walkTo(target, callback, timeoutMs = 10000) {
    stopCurrentWalk()
    bot.lookAt(target)
    bot.setControlState('forward', true)

    const startTime = Date.now()
    walkInterval = setInterval(() => {
      const dx = Math.abs(bot.entity.position.x - target.x)
      const dz = Math.abs(bot.entity.position.z - target.z)
      const timeElapsed = Date.now() - startTime

      if (dx < 0.6 && dz < 0.6) {
        stopCurrentWalk()
        if (callback) callback()
      } else if (timeElapsed > timeoutMs) {
        stopCurrentWalk()
        if (callback) callback('timeout')
      }
    }, 100)
  }

  function startRandomWalk() {
    if (isSleeping) return

    if (!isWithinBounds(bot.entity.position)) {
      bot.chat('📦 Outside walk area, returning to center...')
      walkTo(center, () => {
        bot.chat('✅ Back to center, resuming random walk.')
        setTimeout(startRandomWalk, 1000)
      })
      return
    }

    const steps = Math.floor(Math.random() * (radius - 1)) + 1
    const pos = bot.entity.position.clone()

    for (let attempt = 0; attempt < 10; attempt++) {
      const dir = randomDirection()
      const target = pos.offset(dir.x * steps, 0, dir.z * steps)

      if (isWithinBounds(target)) {
        walkTo(target, () => {
          if (!isSleeping) setTimeout(startRandomWalk, 1000)
        })
        return
      }
    }

    bot.chat('⚠️ No valid random step found. Returning to center...')
    walkTo(center, () => {
      if (!isSleeping) setTimeout(startRandomWalk, 1000)
    })
  }

  bot.once('spawn', () => {
    center = bot.entity.position.clone()
    botStatus = '🟢 Connected and walking'
    bot.chat(`/deop ${old_op}`)
    console.log('🟢 Connected and walking')
    bot.chat('Thanks Server Guardians for reviving me!!')
    startRandomWalk()
  })

  bot.on('forcedMove', () => {
    stopCurrentWalk()
    center = bot.entity.position.clone()
    bot.chat('📍 Teleported! New center set.')
    bot.chat('/deop Wanderbot')
    setTimeout(() => {
      if (!isSleeping) startRandomWalk()
    }, 500)
  })

  bot.on('chat', async (username, message) => {
    if (message === 'sleep') {
      if (isSleeping) {
        bot.chat('💤 I am already sleeping!')
        return
      }

      const bed = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 32
      })

      if (!bed) {
        bot.chat('❌ No bed found nearby.')
        return
      }

      const dangerNearby = Object.values(bot.entities).some(entity => {
        if (!entity.mobType) return false
        const hostileMobs = ['Zombie', 'Skeleton', 'Creeper', 'Spider', 'Husk', 'Drowned']
        return hostileMobs.includes(entity.mobType) &&
               entity.position.distanceTo(bot.entity.position) < 8
      })

      if (dangerNearby) {
        bot.chat('⚠️ Cannot sleep, hostile mob nearby!')
        return
      }

      if (bot.time.isDay) {
        bot.chat('☀️ It is daytime — can’t sleep now.')
        return
      }

      isSleeping = true
      botStatus = '💤 Sleeping...'
      stopCurrentWalk()
      bot.chat('🛏️ Walking to bed to sleep...')

      walkTo(bed.position, (err) => {
        if (err === 'timeout') {
          bot.chat('⏱️ Timed out reaching bed. Returning to center.')
          isSleeping = false
          botStatus = '🔁 Returning after failed sleep'
          walkTo(center, () => startRandomWalk())
          return
        }

        bot.lookAt(bed.position)

        try {
          bot.sleep(bed, (err) => {
            if (err) {
              bot.chat('❌ Could not sleep: ' + err.message)
              isSleeping = false
              botStatus = '⚠️ Sleep failed, resuming walk'
              startRandomWalk()
            }
          })
        } catch (err) {
          bot.chat('❌ Sleep error: ' + err.message)
          isSleeping = false
          botStatus = '⚠️ Sleep error, resuming walk'
          startRandomWalk()
        }
      })
    }
  })

  bot.on('wake', () => {
    bot.chat('🌞 Woke up. Resuming walk.')
    isSleeping = false
    botStatus = '🌞 Woke up, walking again'
    if (!isWithinBounds(bot.entity.position)) {
      bot.chat('↩️ Returning to center...')
      walkTo(center, () => startRandomWalk())
    } else {
      startRandomWalk()
    }
  })

  bot.on('error', err => {
    console.log('❌ Error', err)
    setTimeout(Restart, 2000)
    botStatus = '❌ Error'
  })

  bot.on('end', () => {
    console.log('🔌 Disconnected. Reconnecting in 5 seconds...')
    botStatus = '🔴 Disconnected. Reconnecting...'
    if (walkInterval) clearInterval(walkInterval)
    walkInterval = null
    isSleeping = false
    setTimeout(bot_name, 2000)
    setTimeout(bot_2, 2000)
  })
}
createBot()

 function repo(){
  Restart()
  }

function Restart(){
    bot = mineflayer.createBot({
    host: 'KARBAN2923-JmVS.aternos.me',
    port: 51344,
    username: `Emergency`
    })
    a=1;
   bot.once('spawn', () => {
   console.log(`connected ${new_op} as operator!`)
   bot.chat(`/op bot_0`)
   bot.chat(`/op Wanderot`)
   console.log("Emergency operator join the game!")
   setTimeout(() => {
    console.log('waiting!');
    }, 5000);
   bot.quit('Done!')
   })

   bot.on('error', err => {
    console.log('❌Restart Error')
    setTimeout(repo, 3000)
    botStatus = '❌ Error'
  })
  }


