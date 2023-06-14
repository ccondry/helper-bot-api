const express = require('express')
const router = express.Router()
const model = require('../models/sso')
const makeJwt = require('../models/make-jwt')
const isAdmin = require('../models/is-admin')
const teamsLogger = require('../models/teams-logger')

// get the version of this software and SSO login information
router.get('/', async (req, res, next) => {
  const data = {
    clientId: model.clientId,
    scopes: model.scopes,
    infoUrl: model.infoUrl,
  }
  return res.status(200).send(data)
})

// complete cisco SSO login
router.post('/', async (req, res, next) => {
  let me
  try {
    if (!req.body.code || !req.body.code.length) {
      const message = 'You must include an OAUTH2 code to complete login.'
      return res.status(400).send({message})
    }
    // authorize oauth2 code and get token
    const params = {
      code: req.body.code,
      redirectUri: req.headers.origin + '/'
    }
    // console.log('sso login body params:', req.body)
    // console.log('sso auth params:', params)
    const token = await model.authorize(params)
    // console.log('token', token)
    // get user details from Cisco
    me = await model.verifyOauth2Token(token.id_token)
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
  // console.log('me', me)
  // remove memberof, which can be a long list of data
  // delete me.memberof
  // console.log('trimmed me', me)
  // make the JWT of the user profile data
  try {
    const jwtPayload = {
      // set admin flag
      isAdmin: isAdmin(me),
      // set hashed username 
      sAMAccountName: getHash(me.federated_id),
      federated_id: me.federated_id,
      email: me.email,
      access_level: me.access_level,
      full_name: me.full_name,
      first_name: me.first_name,
      last_name: me.last_name,
      ccoid: me.ccoid,
    }
    const jwt = makeJwt(jwtPayload)
    // return the new JWT
    return res.status(200).send({jwt})
  } catch (e) {
    console.log(e)
    return res.status(500).send({message: e.message})
  }
})

module.exports = router
