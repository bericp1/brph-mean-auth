# brph-mean-auth <small>(backend component)</small>
### An auth solution for the MEAN stack.

This module provides the backend component for brph-mean-auth which is an attempt at managing authentication and
authorization of users in single-page apps using **M** ongoDB *(specifically, mongoose)*, **E** xpress, and **A** ngular
on top of **N** ode.

## Usage

`meanAuth` always returns the following object:

    {
      passport: ...     //The configured passport instance; exposed for further configuration
      router: ...       //See "API Endpoints" below,
      authenticate: ... //See "The Authenticate Middleware" below
    }

For example:

    var express = require('express'),
      mongoose = require('mongoose'),
      meanAuth = require('brph-mean-auth-server');
    
    var app = express();
    
    // Setup mongoose models, express routes, etc. here
    
    //Instantiate meanAuth with the already configured User model
    var auth = meanAuth(mongoose.model('User'));
    
    //Mount the auth router on /auth
    app.use('/auth', auth.router);
    
    //In order to make any requests to /members/*, a user must be authenticated
    app.use('/members', auth.authenticate, function(req, res, next){ ... });

## Parameters

`meanAuth` takes 3 parameters:

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `User` | Yes | The mongoose model used for users. See [The Database Model](#the-database-model) below. |
| `passport` | No | The app's current instance of Passport.JS. This must only be supplied if you have custom passport strategies already configured. If this is not supplied, meanAuth will initialize its own isntance of passport. |
| `options` | No | Various configuration options to control `meanAuth`'s behavior. See [Options](#options) below |

## Options

You can optionally pass an options object as the third parameter passed to `meanAuth`. Here are all possible options and
their defaults:

    var defaults = {
      local: {
        fields: {}                  //See "Custom Fields" below
      },
      tokenBytes: 24,               //The size of the token in bytes before it's converted to a hex string
      tokenTTL: 1000*60*60*24*14    //The number of milliseconds that generated tokens should remain valid
    };

The options object is broken down into a `local` set of options to allow for future support of other non-local auth
strategies.

## The Authenticate Middleware

In order to protect your own custom API endpoints, `auth.authenticate` is exposed. It's standard express middleware that
will only allow requests accomodated with a valid login token proceed down the middleware chain. [See the usage example
above](#usage).

## The Database Model

`meanAuth` requires that it be passed the mongoose (or mongoose-like) model so that it doesn't have to instatiate its
own instance of mongoose which would contain seperate models than that of the express app it's running on. Unfortunately,
it also makes a few assumptions about the structure and interface of said model. The schema for the model must contain
the following fields/paths at a minimum:

    {
      local: {
        email: String,
        password: String,
        token: {
          value: String,
          expires: Number
        }
      }
    }

The purpose of isolating these paths in a subdocument called `local` is so that in the future, `meanAuth` can support
other auth strategies such as Facebook or Google. Currently, that effort is left up to the developer.

### Custom Fields

You are not, however, limited to only storing the user's email and password on signup. To define how the `meanAuth` is
to handle/store other paths available on your model's schema, use the `local.fields` configuration option. This option
should be an object who's keys are paths on the database model and values are objects which define how that path is
handled.

These objects can have any of these fields:

| Field | Type | Description | Default |
| ----- | ---- | ----------- | ------- |
| `required` | `Boolean` | Whether or not this field is required | `true` |
| `param` | `String` | The name of the HTTP POST parameter that this path should get its value from during `/signup` | Same as schema path. |
| `beforeSave` | `Function` | Whatever this function returns, if provided, is saved to the database during `/signup`. It is passed only the data from the HTTP POST parameter. | `function(value){return value;}` |


For example:

    //I've already defined my app and User model
    app.use(meanAuth(User, passport, {
      local: {
        fields: {
          'local.first_name': {
            required: false,
            param: 'fname'
          },
          'local.last_name': {
            required: false,
            param: 'lname'
          },
          'local.weight': {
            required: true,
            param: 'weight',
            beforeSave: function(weight){
              return parseFloat(weight);
            }
          }
        }
      }
    }));

## API Endpoints

The `Router` returned by `auth.router` exposes a few API endpoints that can be used to handle users within the app:

| Endpoint | Method | Description | Input Parameters |
| -------- | ------ | ----------- | ---------------- |
| `/signup` | POST | Create a new user | `email` and `password` are required but additional fields can be defined. See [Custom Fields](#custom-fields) above. |
| `/login` | POST | Authenticate an existing user by email+password | `email` and `password` only |
| `/logout` | POST | Invalidates the user's login token | `token` |
| `/check` | POST | Authenticate an existing user by token | `token` |

### Responses

`/signup`, `/login`, and `/check`, if successful, respond with a JSON object such as the following:

    {
      status: 'ok',
      token: [Valid token],
      user: [User from database]
    }

`/logout` responds simply with:

    {status:'ok'}

The user object pulled from the database has its `local.password` field set to `false` for security purposes.

### Errors

If any of these encounter a handle-able, auth-related error, they will return the following object at a minimum:

    {status:'error', error:'Error Message'}

In addition, if there are any fields relevant to the error, their `param` names (see "[Custom Fields](#custom-fields)"
above) will be passed back alongside the error message in the `fields` array. For example, if the `/login` endpoint is
hit with a mismatched/incorrect email+password pair, it will return the following:

    {
      status: 'error',
      error: 'A user does not exist with that email/password.',
      fields: ['email', 'password']
    }

Or, considering the [custom fields](#custom-fields) example above, the `/signup` endpoint will respond with the
following if the user did not supply their weight (which was a custom field marked as required):

    {
      status: 'error',
      error: 'Missing one or more required fields.',
      fields: ['weight']
    }

## TODO

 - [ ] Move `errors` object into config so that error messages can be extended by developer
 - [ ] `/destory` endpoint
 - [ ] Flexible, configurable model paths so that the developer doesn't have to stick to a specific db model structure
 - [ ] More callbacks/event-handlers for further expandability