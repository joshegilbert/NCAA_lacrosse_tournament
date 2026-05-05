const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config/app.config')

function authMiddleware(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = h.slice(7)
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { authMiddleware }
