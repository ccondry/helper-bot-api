const jwt = require('jsonwebtoken')
const fs = require('fs')
// load the private RSA key file
const key = fs.readFileSync(process.env.JWT_PRIVATE_CERT)

const jwtOptions = {
  algorithm: process.env.JWT_ALGORITHM,
  expiresIn: process.env.JWT_EXPIRES_IN
}

const passphrase = process.env.JWT_PASSPHRASE

module.exports = function (payload, options) {
  // validate user object payload is not too large!
  const s = JSON.stringify(payload)
  if (s.length > 8 * 1024) {
    throw Error('jwt payload too large. The maximum is set to 8KB but you had ' + s.length / 1024 + 'KB.')
  }

  // allow options to be set or use default if not set
  const opt = Object.assign({}, jwtOptions, options)
  return jwt.sign(payload, {key, passphrase}, opt)
}
