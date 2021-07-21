const fetch = require('./fetch')
const db = require('./db')
const uuid = require('uuid')

// database parameters
const collection = 'user'
const database = 'helper'

// convert JSON object to url encoded string
function urlEncode (params) {
  const keys = Object.keys(params)
  let ret = ''
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = params[key]
    if (i !== 0) {
      // not first one
      ret += '&'
    }
    ret += `${key}=${value}`
  }
  return ret
}

async function authorize ({code, redirectUri, rooms}) {
  console.log('webex oauth2 authorize redirect URI:', redirectUri)
  // build body object
  const body = {
    grant_type: 'authorization_code',
    client_id: process.env.WEBEX_OAUTH_CLIENT_ID,
    client_secret: process.env.WEBEX_OAUTH_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri
  }

  console.log('webex oauth2 authorize body:', body)
  // encode the body for x-www-form-urlencoded
  const encodedBody = urlEncode(body)
  // get the token from webex
  try {
    const accessToken = await fetch('https://webexapis.com/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: encodedBody
    })
    // set created time in seconds
    const now = new Date()
    accessToken.created = Math.round(now.getTime() / 1000)
    // get user data associated with this access token
    const me = await fetch('https://webexapis.com/v1/people/me', {
      headers: {
        Authorization: 'Bearer ' + accessToken.access_token,
        Accept: 'application/json'
      }
    })
    // use first email address
    const myEmail = me.emails[0]
    // store user and token in database
    const data = {
      personEmail: myEmail,
      personId: me.id,
      displayName: me.displayName,
      nickName: me.nickName,
      token: accessToken,
      rooms: rooms || [],
      // generate new webhook secret
      webhookSecret: uuid.v4()
    }
    if (me.firstName) {
      data.firstName = me.firstName
    }
    if (me.firstName) {
      data.lastName = me.lastName
    }
    // find existing record
    const query = {personId: me.id}
    // check for existing record for this user
    const existing = await db.findOne(database, collection, query)
    if (existing) {
      // update existing
      // check that we are not overwriting all existing room associations with
      // the new one
      if (existing.rooms && existing.rooms.length) {
        // there are existing room(s) defined for this user
        for (const room of existing.rooms) {
          // insert the existing rooms into data, unless they already exist
          const found = data.rooms.findIndex(v => {
            return v.staffRoomId === room.staffRoomId ||
            v.userRoomId === room.userRoomId ||
            v.staffRoomId === room.userRoomId ||
            v.userRoomId === room.staffRoomId
          })
          if (found < 0) {
            // not found. add existing to update data.
            data.rooms.push(room)
          }
        }
      }
      // update user in database
      const updates = {$set: data}
      await db.updateOne(database, collection, query, updates)
    } else {
      // doesn't exist yet - insert new
      await db.insertOne(database, collection, data)
    }
    return
  } catch (e) {
    // console.log('webex oauth2 add helper bot user failed:', e.message)
    throw e
  }
}

module.exports = {
  authorize
}