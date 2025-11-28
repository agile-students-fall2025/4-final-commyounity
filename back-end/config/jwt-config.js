const mongoose = require('mongoose')
const User = require('../models/User.js')

const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

let jwtOptions = {
  // match what you send from frontend: Authorization: "JWT <token>"
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: process.env.JWT_SECRET,
}

const jwtVerifyToken = async function (jwt_payload, next) {
  console.log('JWT payload received', jwt_payload)

  const expirationDate = new Date(jwt_payload.exp * 1000)
  if (expirationDate < new Date()) {
    return next(null, false, { message: 'JWT token has expired.' })
  }

  try {
    // ✅ no ObjectId conversion needed; use the string id
    const user = await User.findById(jwt_payload.id).exec()

    if (user) {
      next(null, user)
    } else {
      next(null, false, { message: 'User not found' })
    }
  } catch (err) {
    console.error('Error in jwtVerifyToken:', err)
    next(err, false)
  }
}

const jwtStrategy = jwtOptions => {
  const strategy = new JwtStrategy(jwtOptions, jwtVerifyToken)
  return strategy
}

// export a ready-to-use strategy instance for `passport.use(...)`
module.exports = jwtStrategy(jwtOptions)