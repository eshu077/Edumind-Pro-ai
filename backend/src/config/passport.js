const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const hasGoogleCredentials = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL
);

if (hasGoogleCredentials) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Link to an existing email/password account if one exists
            user = await User.findOne({ email: profile.emails[0].value });
          }

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.isEmailVerified = true;
              if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          const newUser = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
            isEmailVerified: true,
          });

          return done(null, newUser);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn(
    "[EduMind Pro AI] Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL missing from .env). " +
      "Email/password auth will work fine — /api/auth/google will return 501 until you add those variables."
  );
}

module.exports = { passport, hasGoogleCredentials };
