import { connectTwitchChat, disconnectTwitchChat } from '../twitch/chatBridge'
let count = 0
const channel = process.argv[2] || 'kamet0'
connectTwitchChat('test-room', channel, {
  onMessage: (u, m) => { if (count < 3) console.log('MSG', u, ':', m.slice(0, 60)); count++ },
  onStatus: (c, e) => console.log('STATUS connected=' + c, e || ''),
})
setTimeout(() => {
  console.log('total messages:', count)
  disconnectTwitchChat('test-room')
  process.exit(count > 0 ? 0 : 1)
}, 18000)
