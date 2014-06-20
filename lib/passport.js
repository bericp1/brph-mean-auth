module.exports = function (User, passport, config) {
  'use strict';

  var LocalStrategy   = require('passport-local').Strategy,
    KeyStrategy     = require('passport-localapikey').Strategy,
    errors          = require('./errors'),
    utils           = require('./utils')(config);

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });

    passport.use('login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password'
      },
      function(email, password, done) {
        User.findOne({ 'local.email' :  email }, function(err, user) {
          if (err)
            return done(err);

          if (!user)
            return done(null, false, {error:errors.email.bad});

          if (!utils.validPassword(user, password))
            return done(null, false, {error:errors.password.bad});

          return utils.generateToken(function(err, token) {
            if (err)return done(err);
            user.local.token.value = token;
            user.local.token.expires = Date.now() + config.tokenTTL;
            return user.save(function (err) {
              if (err) return done(err);
              else return done(null, user);
            });
          });
        });
      }
    ));

    passport.use('check', new KeyStrategy(
      {
        apiKeyField: 'token'
      },
      function(token, done){
        User.findOne({ 'local.token.value': token }, function(err, user){
          if(err)
            return done(err);
          if(!user)
            return done(null, false, {error:errors.token.invalid});
          if(!utils.validToken(user))
            return done(null, false, {error:errors.token.expired});
          return done(null, user);
        });
      }
    ));

  return passport;
};