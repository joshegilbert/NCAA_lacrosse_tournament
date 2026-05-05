const { getDefaultLockDate } = require('./app.config')

module.exports = {
  getDefaultLockTime: () => getDefaultLockDate(),
}
