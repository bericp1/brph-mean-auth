var  passport = require('passport'),
  errors = require('./errors');

module.exports = function(strategy){
  if(typeof strategy !== 'string' || strategy.trim() === ''){
    strategy = 'check';
  }
  return function(req, res, next) {
    passport.authenticate(strategy, {session:false}, function(err, user, info) {
      if (err) { return next(err) }
      if(!user){
        console.log(info);
        if(info.name === 'BadRequestError'){
          if(strategy === 'login')
            info = {error:errors.emailAndPassword, fields:['email','password']};
          else if(strategy === 'check')
            info = {error:errors.token.invalid, fields:['token']}
        }else if(info.hasOwnProperty('message')){
          info.error = info.message;
          delete info.message;
        }
        info.status = 'error';
        return res.send(401, info);
      }else{
        user.local.password = false;
        req.user = user;
        return next();
      }
    })(req, res, next);
  };
};