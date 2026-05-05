const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { jwtSecret } = require('../config/app.config')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
const SALT = 10

function signToken(userId) {
  return jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    const passwordHash = await bcrypt.hash(password, SALT)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    })
    const token = signToken(user._id)
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = signToken(user._id)
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
