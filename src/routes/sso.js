const express = require('express')
const router = express.Router()
const model = require('../models/sso')
const makeJwt = require('../models/make-jwt')
const isAdmin = require('../models/is-admin')
const teamsLogger = require('../models/teams-logger')

// complete cisco SSO login
router.post('/', async (req, res, next) => {
  let token
  try {
    token = await model.authorize({
      code: req.body.code,
      redirectUri: req.headers.referer.split('?')[0].split('#')[0]
    })
  } catch (e) {
    // console.log('failed to get access token from authorization code', req.body.code, ':', e.message)
    if (e.status && e.text) {
      // forward Cisco REST response
      return res.status(e.status).send({message: e.text})
    } else {
      // log unexpected error
      const message = `Failed to complete SSO login: ${e.message}`
      console.log(message)
      teamsLogger.log(message)
      return res.status(500).send({message})
    }
  }

  let me
  try {
    // get user profile with their access token
    me = await model.me(token.access_token)
  } catch (e) {
    let message = ''
    if (e.response.headers.get('content-type').match(/text\/html/i)) {
      // don't return html content
      message = 'Failed to get user profile from access token: ' + e.statusText
    } else {
      message = 'Failed to get user profile from access token: ' + e.message
    }
    console.log(message)
    teamsLogger.log(message)
    return res.status(500).send({message})
  }
  // remove memberof list, which can be a long list of data
  delete me.memberof
  // set admin flag
  me.isAdmin = isAdmin(me)
  // make the JWT of the user profile data
  const jwt = makeJwt(me)
  // return the new JWT
  return res.status(200).send({jwt})
})

module.exports = router
