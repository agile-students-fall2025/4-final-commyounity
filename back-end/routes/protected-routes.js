const express = require('express') // CommonJS import style!
const passport = require('passport')

// a method that contains code to handle routes related to protected content that requires login to access
const protectedRoutes = () => {
  // create a new router that we can customize
  const router = express.Router()

  // middleware that protects all routes in this router
  router.use(passport.authenticate('jwt', { session: false }))

  // any route defined below this line will require a valid JWT

  // example: main protected home/page
  router.get('/', (req, res, next) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      message: 'You reached the protected root route!',
    })
    next()
  })

  // example: a protected profile page
  router.get('/profile', (req, res, next) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      message: 'This is your protected profile page.',
    })
    next()
  })

  // example: another protected page
  router.get('/settings', (req, res, next) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      message: 'These are your protected settings.',
    })
    next()
  })

  return router
}

// export the function that contains code to handle protected routes
module.exports = protectedRoutes