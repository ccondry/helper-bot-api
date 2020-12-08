const mongo = require('@ccondry/mongo-wrapper')
const logLevel = 0
const options = {}
const db = new mongo(process.env.MONGO_URL, options, logLevel)

module.exports = db