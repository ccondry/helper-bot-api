const express = require('express')
const router = express.Router()

// return 200 if valid JWT
router.get('/', async (req, res, next) => {
  return res.status(200).send()
})

module.exports = router
