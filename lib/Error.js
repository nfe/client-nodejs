'use strict';

var utils = require('./utils');

module.exports = _Error;

/**
 * Generic Error class to wrap any errors returned by iugu-node
 */
function _Error(raw) {
  this.populate.apply(this, arguments);
}

// Extend Native Error
_Error.prototype = Object.create(Error.prototype);

_Error.prototype.type = 'GenericError';
_Error.prototype.populate = function(type, message) {
  this.type = type;
  this.message = message;
};

_Error.extend = utils.protoExtend;

/**
 * Create subclass of internal Error class
 * (Specifically for errors returned from NFe.io REST API)
 */
var ResourceError = _Error.ResourceError = _Error.extend({
  type: 'ResourceError',
  populate: function(raw) {

    // Move from prototype def (so it appears in stringified obj)
    this.type = this.type;

    this.code = raw.code;
    this.message = raw.message;
    this.raw = raw;
  }
});

/**
 * Helper factory which takes raw iugu errors and outputs wrapping instances
 */
ResourceError.generate = function(raw) {
  
  switch (raw.code) {
      case 400:
        return new _Error.BadRequestError(raw);
        break;
      case 404:
        return new _Error.NotFoundError(raw);
        break;
      case 409:
        return new _Error.ConflictError(raw);
        break;
      default:
        return new _Error.APIError(raw);
        break;
  }
  
  return new _Error('Generic', 'Unknown Error');
};

// Specific Stripe Error types:
_Error.ConflictError = ResourceError.extend({ type: 'ConflictError' });
_Error.BadRequestError = ResourceError.extend({ type: 'BadRequestError' });
_Error.NotFoundError = ResourceError.extend({ type: 'NotFoundError' });
_Error.APIError = ResourceError.extend({ type: 'APIError' });
_Error.AuthenticationError = ResourceError.extend({ type: 'AuthenticationError' });
_Error.ConnectionError = ResourceError.extend({ type: 'ConnectionError' });
