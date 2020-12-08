const atob = require('atob')

// parse JWT to JSON
export const parseJwt = function (token) {
  // split the JWT on .
  const base64Url = token.split('.')[1]
  // replace - with + and replace _ with /
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  // decode base64 to text, and parse that text as JSON
  return JSON.parse(atob(base64))
}

