// Cisco SSO oauth2
const fetch = require('./fetch')

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

module.exports = {
  async authorize ({code, redirectUri}) {
    // console.log('sso authorize:', code, redirectUri)
    // build body object
    const body = {
      grant_type: 'authorization_code',
      client_id: process.env.CISCO_OAUTH_CLIENT_ID,
      client_secret: process.env.CISCO_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    }
    // encode the body for x-www-form-urlencoded
    const encodedBody = urlEncode(body)
    // get the token from cisco
    try {
      const url = 'https://cloudsso.cisco.com/as/token.oauth2'
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body: encodedBody
      }
      const accessToken = await fetch(url, options)
      return accessToken
    } catch (e) {
      throw e
    }
  },
  async me (access_token) {
    // console.log('getting user info openid with token', access_token)
    // get user data associated with this access token
    const url = 'https://cloudsso.cisco.com/idp/userinfo.openid'
    const options = {
      query: {
        access_token
      }
    }
    try {
      const response = await fetch(url, options)
      return response
    } catch (e) {
      throw e
    }
  }
}