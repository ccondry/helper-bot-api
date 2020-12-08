const express = require('express')
const router = express.Router()
const environment = require('../models/environment')

// get the version of this software
router.get('/', async (req, res, next) => {
  try {
    // add software version and server we are running on
    const data = {
      name: environment.name,
      version: environment.version
    }
    return res.status(200).send(data)
  } catch (e) {
    console.log(`Failed to get server info:`, e.message)
    return res.status(500).send(e.message)
  }
})

module.exports = router
