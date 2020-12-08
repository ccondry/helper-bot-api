let admins = []
try {
  admins = process.env.SYSTEM_ADMINS.split(',').map(v => v.trim())
} catch (e) {
  // 
}

module.exports = function (user) {
  return admins.includes(user.sub)
}