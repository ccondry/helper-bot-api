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
    console.log('get bot users failed:', error.message)
    return res.status(500).send(error.message)
  }
})

// update helper bot user details
router.put('/:id', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    // find the existing helper bot user details
    const query = {
      _id: db.ObjectID(req.params.id)
    }
    const user = await db.findOne('helper', 'user', query)
    if (!user) {
      const message = `user ${req.params.id} not found`
      return res.status(404).send({message})
    }
    // remove _id from body
    delete req.body._id
    // update the user in database
    const updates = {
      $set: req.body
    }
    await db.updateOne('helper', 'user', query, updates)
    // done
    return res.status(200).send()
  } catch (error) {
    console.log('update bot user failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

module.exports = router