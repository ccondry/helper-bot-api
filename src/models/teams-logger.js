const fetch = require('./fetch')
const env = require('./environment')

// trim message to 7439 bytes for Webex to accept it
function trimMessage (message) {
  // does message exceed max text size for Webex?
  if (Buffer.byteLength(message, 'utf8') > 7439) {
    // make a buffer of the message
    const buf1 = Buffer.from(message, 'utf8')
    // allocate max size buffer
    const buf2 = Buffer.allocUnsafe(7439)
    // copy to the max size buffer
    buf1.copy(buf2, 0, 0, 7439)
    // set message value to truncated message
    message = buf1.toString('utf8')
  }
  return message
}

// main log method
async function log (args) {
  let text = ''
  let markdown
  if (typeof args === 'string') {
    // user passed a single string
    text = trimMessage(args)
  } else if (typeof args === 'object') {
    // user passed an object
    // save trimmed text
    text = trimMessage(args.text || '')
    // trim markdown, if exists
    if (args.markdown) {
      markdown = trimMessage(args.markdown)
    }
  }

  if (!text && !markdown) {
    // empty or no log message, so do nothing
    console.log('empty log message sent to Webex Teams logger. igoring it.')
    return
  }

  if (!markdown) {
    // if no markdown set yet, add text as markdown
    markdown = text
  }

  // define text prefix for this service
  const datacenter = process.env.DCLOUD_DATACENTER || '(unknown)'
  const textPrefix = `${env.name} ${env.version} on ${env.hostname} in ${datacenter}: `
  const markdownPrefix = `**${env.name} ${env.version}** on **${env.hostname}** in **${datacenter}**: `
  // add prefix to plaintext
  text = textPrefix + text
  // add prefix to markdown
  markdown = markdownPrefix + markdown

  // send message to room
  const url = 'https://webexapis.com/v1/messages'
  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.WEBEX_BOT_TOKEN
    },
    body: {
      roomId: process.env.LOGS_ROOM_ID,
      text,
      markdown
    }
  }).catch(e => {
    console.log('failed to send log message to Webex Teams room:', e.message)
  })
}

// define all levels as the same function for now
module.exports = {
  log,
  error: log,
  info: log,
  debug: log,
  warning: log
}
