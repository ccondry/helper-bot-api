// helper bot
const express = require('express')
const router = express.Router()
const db = require('../models/db')
const webex = require('../models/webex')
const isAdmin = require('../models/is-admin')

// get matching user token for specified user room ID
async function getToken (id) {
  try {
    // find helper bot token for the room ID
    const query = {
      'rooms.userRoomId': id
    }
    // find helper bot user
    const user = await db.findOne('helper', 'user', query)
    return user.token.access_token
  } catch (e) {
    throw e
  }
}

// get matching user token for specified user or staff room ID
async function adminGetToken (id) {
  try {
    // find helper bot token for the room ID
    const query = {
      $or: [
        {'rooms.userRoomId': id},
        {'rooms.staffRoomId': id}
      ]
    }
    // find helper bot user
    const user = await db.findOne('helper', 'user', query)
    return user.token.access_token
  } catch (e) {
    throw e
  }
}

// list helper bot rooms
router.get('/', async function (req, res, next) {
  try {
    const query = {}
    // don't get token or webhook secret
    const projection = {
      webhookSecret: 0
    }
    // get all helper bot users
    const users = await db.find('helper', 'user', query, projection)
    
    // get list of all user rooms and their titles
    const rooms = []
    for (const user of users) {
      for (const room of user.rooms) {
        // get current title of room
        const title = await webex.getRoomName({
          roomId: room.userRoomId,
          token: user.token.access_token
        })
        // add room details to list
        rooms.push({
          id: room.userRoomId,
          title
        })
      }
    }

    // return rooms list
    return res.status(200).send(rooms)
  } catch (e) {
    console.log('get rooms failed:', e.message)
    return res.status(500).send({message: e.message})
  }
})

// join room
router.post('/:id/join', async function (req, res, next) {
  try {
    // get matching user token for this room ID
    const token = await getToken(req.params.id)
    if (!token) {
      const message = `could not find token for room ID "${req.params.id}"`
      return res.status(404).send({message})
    }
    // user helper bot token to add user to room
    await webex.joinRoom({
      email: req.user.email,
      roomId: req.params.id,
      token
    })
    // done
    return res.status(200).send()
  } catch (e) {
    if (e.status === 409) {
      // user already in room
      return res.status(409).send({message: e.message})
    } else {
      // unexpected error
      console.log(`add user ${req.user.email} to room failed:`, e.message)
      return res.status(500).send({message: e.message})
    }
  }
})

// admin get room full details
router.get('/:id', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    // get matching user token for this room ID
    const token = await adminGetToken(req.params.id)
    if (!token) {
      const message = `could not find token for room ID "${req.params.id}"`
      return res.status(404).send({message})
    }
    // get room info using helper bot user's token
    const room = await webex.getRoom({
      roomId: req.params.id,
      token
    })
    return res.status(200).send(room)
  } catch (error) {
    console.log('admin get room details failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

module.exports = router