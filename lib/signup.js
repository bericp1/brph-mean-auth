module.exports = function(User, config, authenticate){

  var errors            = require('./errors'),
    utils             = require('./utils')(config);

  return function(req, res, next){
    var missing = [],
      required = ['email', 'password'],
      fields = config.local.fields;
    for(var path in fields) if(fields.hasOwnProperty(path)) if(!!fields[path].required) required.push(fields[path].param);
    required.forEach(function(field){
      if(
        !req.body.hasOwnProperty(field)
        || typeof req.body[field] === "undefined"
        || (typeof req.body[field] === 'string' && req.body[field].trim() === '')
        ){
        missing.push(field);
      }
    });
    if(missing.length > 0){
      res.send(400, {error: errors.signup.missing, fields: missing, status: 'error'});
    }else{
      User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
        if (err)
          return next(err);

        if (user) {
          return res.send(401, {error:errors.email.exists, fields:['email'], status: 'error'});
        } else {

          var newUser            = new User();
          newUser.local.email    = req.body.email;
          newUser.local.password = utils.generateHash(req.body.password);

          for(var key in fields)
            if(fields.hasOwnProperty(key))
              newUser.local[key] = fields[key].beforeSave(req.body[fields[key].param]);

          return newUser.save(function(err) {
            if(err) return next(err);
            else{
              return authenticate('login')(req, res, next);
            }
          });
        }
      });
    }
  }
};