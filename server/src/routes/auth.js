const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const jwt = require('jsonwebtoken')

const router = express.Router()

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.SERVER_URL || 'http://localhost:3000'}/auth/google/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value
    if (email !== process.env.ADMIN_EMAIL) {
      return done(null, false)
    }
    done(null, { id: profile.id, email, name: profile.displayName })
  }
))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

router.use(passport.initialize())

router.get('/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
)

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/#/admin?error=unauthorized`
  }),
  (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/#/admin?token=${token}`)
  }
)

module.exports = router
