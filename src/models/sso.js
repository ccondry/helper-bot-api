// Cisco SSO oauth2
const fetch = require('./fetch')
const jsonwebtoken = require('jsonwebtoken')
const crypto = require('crypto')

const clientId = process.env.CISCO_OAUTH_CLIENT_ID
const clientSecret = process.env.CISCO_OAUTH_CLIENT_SECRET
const scopes = [
  'profile',
  'email',
  'openid'
]
const defaultInfoUrl = 'https://id.cisco.com/oauth2/default/.well-known/oauth-authorization-server'
const infoUrl = process.env.CISCO_OAUTH_INFO_URL || defaultInfoUrl

// convert JSON object to url encoded string
const urlEncode = function (params) {
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

function getOauth2Info () {
  // get oauth server info
  return fetch(infoUrl)
}

async function authorize ({code, redirectUri}) {
  try {
    // build body object
    const body = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    }
    // encode the body for x-www-form-urlencoded
    const encodedBody = urlEncode(body)
    // get the token from cisco
    // const url = process.env.CISCO_OAUTH_INFO_URL
    // const url = 'https://int-id.cisco.com/oauth2/default/v1/token'
    const wellKnown = await getOauth2Info()
    const url = wellKnown.token_endpoint
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: encodedBody
    }
    return await fetch(url, options)
  } catch (e) {
    const message = 'OAUTH2 login failed: ' + e.message
    if (e.status === 400) {
      throw new TypeError(message)
    } else {
      throw new Error(message)
    }
  }
}

async function verifyOauth2Token (token) {
  try {
    // me = await ciscoSso.me(token.access_token)
    // get oauth server info
    const wellKnown = await getOauth2Info()
    // get the oauth server's jwk keys
    const serverKeys = (await fetch(wellKnown.jwks_uri)).keys
    // console.log('serverKeys', serverKeys)

    // decode user's access token without verifying the JWT yet
    // to get the header information
    const decodedUserJwt = jsonwebtoken.decode(token, {complete: true})
    // console.log('decodedUserJwt', decodedUserJwt)

    // find the server jwk key that matches the access token kid and alg
    const serverKey = serverKeys.find(key => {
      return key.kid === decodedUserJwt.header.kid &&
        key.alg === decodedUserJwt.header.alg
    })
    // console.log('serverKey', serverKey)

    // convert jwk to pem
    const publicKey = crypto.createPublicKey({ key: serverKey, format: 'jwk' })
    const serverPem = publicKey.export({ type: 'pkcs1', format: 'pem' })

    // verify and decode the user JWT. throws error if invalid.
    return jsonwebtoken.verify(token, serverPem)
  } catch (e) {
    throw e
  }
}


module.exports = {
  clientId,
  scopes,
  infoUrl,
  authorize,
  verifyOauth2Token
}