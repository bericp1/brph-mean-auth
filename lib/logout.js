var errors = require('./errors');

module.exports = function(User){
  return function(req, res, next){

    User.findOne({'local.token.value': req.user.local.token.value }, function(err, user){
      if(err) {
        console.error('Database error:\n', err);
        return res.send(500, {error: errors.database});
      }
      if(!user)
        return res.send(401, {error: errors.token.invalid});

      user.local.token.expires = 0;
      return user.save(function(err){
        if(err) {
          console.error('Database error:\n', err);
          res.send(500, {error: errors.database});
        }
        delete req.user;
        return next();
      });
    });

  };
};