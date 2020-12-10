// helper bot
const express = require('express')
const router = express.Router()
const db = require('../models/db')
const isAdmin = require('../models/is-admin')
const oauth2 = require('../models/oauth2')
const webex = require('../models/webex')

// list helper bot users
router.get('/', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    const query = {}
    // get helper bot users
    const users = await db.find('helper', 'user', query)
    return res.status(200).send(users)
  } catch (error) {
    console.log('get bot users failed:', error.message)
    return res.status(500).send(error.message)
  }
})

// Webex OAUTH2 flow for adding new user accounts as helper bots
router.post('/', async (req, res, next) => {
  console.log('creating new bot user...')
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    // oauth2 data
    const data = {
      code: req.body.code,
      redirectUri: req.headers.referer.split('?')[0]
    }
    // get and store access token from webex
    await oauth2.authorize(data)
    // success
    return res.status(200).send({
      message: 'You have successfully authorized this application with your Webex Teams account.'
    })
  } catch (e) {
    console.log(`Failed to create new bot user:`, e.message)
    return res.status(500).send({
      message: 'There was an error authorizing this application with your Webex Teams account: ' + e.message
    })
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
    // remove _id and token from body, so they are not overwritten
    delete req.body._id
    delete req.body.token
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

// delete helper bot user
router.delete('/:id', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    // find the existing helper bot user details
    const query = {
      _id: db.ObjectID(req.params.id)
    }
    const response = await db.removeOne('helper', 'user', query)
    return res.status(200).send(response)
  } catch (error) {
    console.log('delete bot user failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

// get matching bearer token for specified user ID
async function getToken (id) {
  try {
    // find helper bot user
    const user = await getUser(id)
    // return their token
    return user.token.access_token
  } catch (e) {
    throw e
  }
}

// get matching bearer token for specified user ID
async function getUser (id) {
  // find helper bot token for the room ID
  let _id
  try {
    _id = db.ObjectID(id)
  } catch (e) {
    throw Error(`Failed to create mongo ObjectID from input "${id}"`)
  }
  const query = {_id}
  // find helper bot user
  return db.findOne('helper', 'user', query)
}

// admin get user webhook list
router.get('/:id/webhook', async function (req, res, next) {
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  try {
    // get user token
    const token = await getToken(req.params.id)
    if (!token) {
      const message = `could not find token for user ID "${req.params.id}"`
      return res.status(404).send({message})
    }
    // get room info using helper bot user's token
    const webhooks = await webex.getWebhooks({token})
    return res.status(200).send(webhooks)
  } catch (error) {
    console.log('admin get user webhook list failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

// admin create user webhook
router.post('/:id/webhook', async function (req, res, next) {
  console.log('create webhook for id', req.params.id)
  if (!isAdmin(req.user)) {
    const message = 'you do not have permission to access this resource'
    return res.status(403).send({message})
  }
  if (req.params.id.length !== 24) {
    // invalid ID
    const message = `the ID you specified is invalid: "${req.params.id}"`
    return res.status(400).send({message})
  }
  try {
    // get user token
    const user = await getUser(req.params.id)
    if (!user) {
      const message = `could not find token for user ID "${req.params.id}"`
      return res.status(404).send({message})
    }
    await webex.createWebhook({
      token: user.token.access_token,
      secret: user.webhookSecret
    })
    return res.status(200).send()
  } catch (error) {
    console.log('admin create webhook failed:', error.message)
    return res.status(500).send({message: error.message})
  }
})

module.exports = router