module.exports = function (User, config, authenticate) {
  'use strict';

  //Deps
  var express = require('express'),
    signup = require('./signup')(User, config, authenticate),
    logout = require('./logout')(User);

  var router = express.Router();

  router.post('/signup',
    signup,
    function(req,res){
      res.send({
        status: 'ok',
        token: req.user.local.token.value,
        user: req.user
      });
    }
  );

  router.post('/login',
    authenticate('login'),
    function(req,res){
      res.send({
        status: 'ok',
        token: req.user.local.token.value,
        user: req.user
      });
    }
  );

  router.post('/logout',
    authenticate(),
    logout,
    function(req,res){
      res.send({
        status: 'ok'
      });
    }
  );

  router.post('/check',
    authenticate(),
    function(req, res){
      res.send({
        status: 'ok',
        token: req.user.local.token.value,
        user: req.user
      });
    }
  );

  return router;

};