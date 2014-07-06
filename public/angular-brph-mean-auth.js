(function(angular){

  var MeanAuthServiceProvider = function(){

    var config = {
      path: '/'
    };

    this.setPath = function(path){
      config.path = path;
      if(config.path.slice(-1) !== '/'){
        config.path += '/';
      }
    };

    this.$get = ['$http', '$cookies', function($http, $cookies){
      'use strict';

      var Service = function(){
        var service = this;

        service.token = false;
        service.user = false;
        service.schedule = [];

        if(typeof $cookies.authToken === 'string'){
          service._creativeRequest('check', {token:$cookies.authToken}, null, function(){
            delete $cookies.authToken;
          });
        }
      };

      Service.prototype._genericRequest = function(path, payload, success, error){
        var request = $http.post(config.path + path, payload);
        if(typeof success === 'function'){
          request.success(success);
        }
        if(typeof error === 'function'){
          request.error(error);
        }
        return request;
      };

      Service.prototype._creativeRequest = function(path, payload, success, error){
        var service = this;
        return this._genericRequest(
          path,
          payload,
          function(data){
            service.token = $cookies.authToken = data.token;
            service.user = data.user;
            if(typeof success === 'function')
              success.apply(this, arguments);
            service.schedule.forEach(function(func){
              func(service.user);
            });
          },
          error
        );
      };

      Service.prototype.login = function(payload, success, error){
        return this._creativeRequest('login', payload, success, error);
      };

      Service.prototype.signup = function(payload, success, error){
        return this._creativeRequest('signup', payload, success, error);
      };

      Service.prototype.logout = function(more){
        var service = this;
        var done = function(){
          service.token = false;
          service.user = false;
          delete $cookies.authToken;
          if(typeof more === 'function'){
            more.apply(this, arguments);
          }
        };
        return service._genericRequest('logout', {token: service.token}, done, function(data, status){
          if(status === 500){
            console.error('Session couldn\'t be invalidated on the server. Server response:', data);
          }
          done.apply(this, arguments);
        });
      };

      Service.prototype.runAsUser = function(func){
        var service = this;
        if(typeof func === 'function'){
          if(service.user === false){
            service.schedule.push(func);
          }else{
            func(service.user);
          }
        }
      };

      return new Service();
    }];
  };

  angular.module('brph.mean-auth', ['ngCookies']).provider('MeanAuthService', MeanAuthServiceProvider);

})(angular);