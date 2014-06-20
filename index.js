module.exports = function (User, passport, config) {
  'use strict';

  if(typeof config !== 'object'){
    if(typeof passport !== 'object'){
      config = {};
      passport = require('passport');
    }else if(typeof passport.Passport !== 'object'){
      config = passport;
      passport = require('passport');
    }else{
      config = {};
    }
  }

  var extend = require('extend'),
    util = require('util');

  var defaults = {
    local: {
      fields: {}
    },
    tokenBytes: 24,
    tokenTTL: 1000*60*60*24*14
  };

  var defaultField = {
    required: true,
    beforeSave: function(value){return value;}
  };

  config = extend(true, defaults, config);

  if(util.isArray(config.local.fields)){
    config.local.fields = (function(fields){
      var temp = {};
      fields.forEach(function(field){
        temp[field] = field;
      });
      return temp;
    })(config.local.fields);
  }

  for(var path in config.local.fields) if(config.local.fields.hasOwnProperty(path)){
    var opts = config.local.fields[path];
    if(typeof opts === 'string'){
      config.local.fields[path] = opts = {param: opts};
    }
    if(typeof opts === 'object'){
      config.local.fields[path] = extend({}, defaultField, opts);
      if(typeof config.local.fields[path].param !== 'string'){
        config.local.fields[path].param = path;
      }
    }else{
      delete config.local.fields[path];
    }
  }

  require('./lib/passport')(User, passport, config);

  return require('./lib/route')(User, config);

};