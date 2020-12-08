const fetch = require('./fetch')

async function getRoomName ({roomId, token}) {
  try {
    const room = await getRoom({roomId, token})
    return room.title
  } catch (e) {
    console.log(`webex.getRoomName failed for roomId ${roomId} with token ${token}`)
    throw e
  }
}

async function getRoom ({roomId, token}) {
  const url = 'https://webexapis.com/v1/rooms/' + roomId
  const options = {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
  return fetch(url, options)
}

async function joinRoom ({roomId, email, token}) {
  const url = 'https://webexapis.com/v1/memberships/'
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: {
      roomId,
      personEmail: email
    }
  }
  return fetch(url, options)
}

module.exports = {
  getRoom,
  getRoomName,
  joinRoom
}