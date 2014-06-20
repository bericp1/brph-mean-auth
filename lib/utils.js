module.exports = function (config) {
  'use strict';

  var bcrypt = require('bcrypt-nodejs'),
    crypto = require('crypto');

  return {
    generateHash: function(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    generateToken: function(done){
      crypto.randomBytes(config.tokenBytes, function(err, buf) {
        if(err) return done(err);
        else    return done(null, buf.toString('hex'));
      });
    },
    validPassword: function(user, password) {
      return bcrypt.compareSync(password, user.local.password);
    },
    validToken: function(user){
      return Date.now() < user.local.token.expires;
    }
  };
};