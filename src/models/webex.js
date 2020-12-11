const fetch = require('./fetch')

async function getRoomName ({roomId, token}) {
  try {
    const room = await getRoom({roomId, token})
    return room.title
  } catch (e) {
    // console.log(`webex.getRoomName failed for roomId ${roomId} with token ${token}`)
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

async function getWebhooks ({token}) {
  const url = 'https://webexapis.com/v1/webhooks/'
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

async function createWebhook ({token, secret}) {
  const url = 'https://webexapis.com/v1/webhooks/'
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: {
      name: 'mm-helper',
      targetUrl: 'https://mm-helper.cxdemo.net/api/v1/webhook',
      resource: 'messages',
      event: 'created',
      // filter: '',
      secret
    }
  }
  return fetch(url, options)
}

async function deleteWebhook ({token, id}) {
  const url = 'https://webexapis.com/v1/webhooks/' + id
  const options = {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
  return fetch(url, options)
}

async function getMemberships ({token}) {
  // actually use the rooms API though
  const url = 'https://webexapis.com/v1/rooms'
  const options = {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
  return fetch(url, options)
}

async function createMembership ({
  token,
  roomId,
  personId,
  personEmail
}) {
  const url = 'https://webexapis.com/v1/memberships'
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: {
      personId,
      personEmail,
      roomId
    }
  }
  return fetch(url, options)
}

async function createRoom ({token, title}) {
  const url = 'https://webexapis.com/v1/rooms'
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: {
      title
    }
  }
  return fetch(url, options)
}

module.exports = {
  getRoom,
  getRoomName,
  joinRoom,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getMemberships,
  createMembership,
  createRoom
}