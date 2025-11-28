const express = require('express') // CommonJS import style!

// a method that contains code to handle cookie-related routes
const cookieRouter = () => {
  // create a new router that we can customize
  const router = express.Router()

  // a route that sends a response including Set-Cookie headers for userId and username
  // Example usage (for testing):
  //   GET /cookies/set?userId=123&username=alice
  router.get('/set', (req, res) => {
    const userId = req.query.userId || '12345'       // fallback example value
    const username = req.query.username || 'testuser'

    res
      .cookie('userId', userId, {
        httpOnly: true,
        sameSite: 'strict',
        secure: false, // set to true when using HTTPS in production
      })
      .cookie('username', username, {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
      })
      .send({
        success: true,
        message: 'Sent userId and username cookies to the browser.',
        userId: userId,
        username: username,
      })
  })

  // a route that looks for a Cookie header in the request and sends back whatever data was found in it.
  router.get('/get', (req, res) => {
    const numCookies = Object.keys(req.cookies || {}).length // how many cookies were passed to the server

    console.log(`Incoming cookie data: ${JSON.stringify(req.cookies, null, 0)}`)

    res.send({
      success: numCookies ? true : false,
      message: numCookies
        ? 'thanks for sending cookies to the server :)'
        : 'no cookies sent to server :(',
      cookieData: req.cookies,
      userId: req.cookies.userId || null,
      username: req.cookies.username || null,
    })
  })

  // optional: clear the user cookies
  router.get('/clear', (req, res) => {
    res
      .clearCookie('userId', {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
      })
      .clearCookie('username', {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
      })
      .send({
        success: true,
        message: 'Cleared userId and username cookies.',
      })
  })

  return router
}

// export the router
module.exports = cookieRouter