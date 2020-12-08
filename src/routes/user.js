// helper bot
const express = require('express')
const router = express.Router()
const db = require('../models/db')
const isAdmin = require('../models/is-admin')

// list helper bot users
router.get('/', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    const query = {}
    // don't get token or webhook secret
    const projection = {
      token: 0,
      webhookSecret: 0
    }
    // get helper bot users
    const users = await db.find('helper', 'user', query, projection)
    return res.status(200).send(users)
  } catch (error) {
    console.log('get instances failed:', error.message)
    return res.status(500).send(error.message)
  }
})

// get room details for a specified user
router.get('/:userId/room/:roomId', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    const query = {
      _id: db.ObjectID(req.params.userId)
    }
    // get helper bot users
    const user = await db.findOne('helper', 'user', query)
    if (!user) {
      const message = `user ${req.params.userId} not found`
      return res.status(404).send({message})
    }
    // get room info using helper bot user's token
    const room = await fetch(`https://webexapis.com/v1/rooms/${roomId}`, {
      headers: {
        Authorization: `Bearer ${user.token.access_token}`
      }
    })
    return res.status(200).send(room)
  } catch (error) {
    console.log('get instances failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

module.exports = router