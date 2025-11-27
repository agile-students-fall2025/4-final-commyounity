const express = require('express')
const User = require('../models/User.js')

const authenticationRouter = () => {
  const router = express.Router()

  router.post('/signup', async (req, res) => {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password

    if (!username || !email || !password) {
      res.status(401).json({
        success: false,
        message: `No username, email, or password supplied.`,
      })
      return
    }

    try {
      const existingUsername = await User.findOne({ username: username.toLowerCase() })
      if (existingUsername) {
        res.status(409).json({
          success: false,
          message: 'Username already taken.',
        })
        return
      }

      const existingEmail = await User.findOne({ email: email.toLowerCase() })
      if (existingEmail) {
        res.status(409).json({
          success: false,
          message: 'Email already registered.',
        })
        return
      }

      const user = await new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: password,
        name: username,
        authProvider: 'local',
      }).save()
      
      console.error(`New user: ${user}`)
      const token = user.generateJWT()
      res.json({
        success: true,
        message: 'User saved successfully.',
        token: token,
        username: user.username,
        email: user.email,
        name: user.name,
      })
      return
    } catch (err) {
      console.error(`Failed to save user: ${err}`)
      res.status(500).json({
        success: false,
        message: 'Error saving user to database.',
        error: err,
      })
      return
    }
  })

  router.post('/login', async function (req, res) {
    const username = req.body.username
    const password = req.body.password

    if (!username || !password) {
      res.status(401).json({ success: false, message: `No username or password supplied.` })
      return
    }

    try {
      const user = await User.findOne({ username: username.toLowerCase() }).exec()
      if (!user) {
        console.error(`User not found.`)
        res.status(401).json({
          success: false,
          message: 'User not found in database.',
        })
        return
      }
      else if (!user.validPassword(password)) {
        console.error(`Incorrect password.`)
        res.status(401).json({
          success: false,
          message: 'Incorrect password.',
        })
        return
      }
      console.log('User logged in successfully.')
      const token = user.generateJWT()
      res.json({
        success: true,
        message: 'User logged in successfully.',
        token: token,
        username: user.username,
        email: user.email,
        name: user.name,
      })
      return
    } catch (err) {
      console.error(`Error looking up user: ${err}`)
      res.status(500).json({
        success: false,
        message: 'Error looking up user in database.',
        error: err,
      })
      return
    }
  })

  router.get('/logout', function (req, res) {
    res.json({
      success: true,
      message: "There is actually nothing to do on the server side... you simply need to delete your token from the browser's local storage!",
    })
    return
  })

  return router
}

module.exports = authenticationRouter

