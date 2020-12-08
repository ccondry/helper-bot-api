const os = require('os')
const pkg = require('../../package.json')

// hostname of server running this code
const hostname = os.hostname()
// the name of this software
const name = pkg.name
// the version of this software
const version = pkg.version

module.exports = {
  hostname,
  name,
  version
}