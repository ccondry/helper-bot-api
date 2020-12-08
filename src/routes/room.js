// helper bot
const express = require('express')
const router = express.Router()
const db = require('../models/db')
const webex = require('../models/webex')

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
        const title = await webex.getRoomName(room.userRoomId, user.token.access_token)
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
    // find helper bot token for the room ID
    const query = {
      'rooms.userRoomId': req.params.id
    }
    // find helper bot user
    const user = await db.findOne('helper', 'user', query)
    // user helper bot token to add user to room
    await webex.joinRoom({
      email: req.user.email,
      roomId: req.params.id,
      token: user.token.access_token
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

module.exports = router