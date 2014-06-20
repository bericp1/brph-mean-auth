module.exports = {
  generic: {
    required:         '{PATH} is required.'
  },
  email: {
    exists:           'A user with that email already exists.'
  },
  token: {
    invalid:          'Invalid token.',
    expired:          'Expired token.'
  },
  login: {
    missing:          'You need an email and a password to login.',
    bad:              'A user does not exist with that email/password.'
  },
  signup: {
    missing:          'Missing one or more required fields.'
  },
  unauthorized:       'Unauthorized',
  database:           'Server error with database. Try again later.'
};