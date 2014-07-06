(function(angular){

  var MeanAuthServiceProvider = function(){

    var config = {
      path: '/'
    };

    this.setPath = function(path){config.path = path;};

    this.$get = ['$http', '$cookies', function($http, $cookies){
      'use strict';

      var service = this;

      service.token = false;
      service.user = false;
      service.schedule = [];

      var genericRequest = function(path, payload, success, error){
        if(typeof success !== 'function'){
          success = function(){};
        }
        if(typeof error !== 'function'){
          error = function(){};
        }
        return $http
          .post(config.path + path, payload)
          .success(success)
          .error(error);
      };

      var creativeRequest = function(path, payload, success, error){
        return genericRequest(
          path,
          payload,
          function(data){
            service.token = data.token;
            service.user = $cookies.authToken = data.user;
            success.apply(this, arguments);
            service.schedule.forEach(function(func){
              func(service.user);
            });
          },
          error
        );
      };

      if(typeof $cookies.authToken === 'string'){
        creativeRequest('check', {token:$cookies.authToken}, null, function(){
          delete $cookies.authToken;
        });
      }

      service.login = function(payload, success, error){
        return creativeRequest('login', payload, success, error);
      };

      service.signup = function(payload, success, error){
        return creativeRequest('signup', payload, success, error);
      };

      service.logout = function(more){
        var done = function(){
          service.token = $cookies.authToken = false;
          service.user = false;
          if(typeof more === 'function'){
            more.apply(this, arguments);
          }
        };
        return genericRequest('logout', {token: service.token}, done, function(data, status){
          if(status === 500){
            console.error('Session couldn\'t be invalidated on the server. Server response:', data);
          }
          done.apply(this, arguments);
        });
      };

      service.runAsUser = function(func){
        if(typeof func === 'function'){
          if(service.user === false){
            service.schedule.push(func);
          }else{
            func(service.user);
          }
        }
      };
    }];
  };

  angular.module('brph.mean-auth', ['ngCookies']).provider('MeanAuthService', MeanAuthServiceProvider);

})(angular);