'use strict';

var constants = require('constants');
var http = require('http');
var https = require('https');
var path = require('path');
var when = require('when');

var utils = require('./utils');
var Error = require('./Error');

var hasOwn = {}.hasOwnProperty;

// Provide extension mechanism for NFe.io Resource Sub-Classes
NfeResource.extend = utils.protoExtend;

// Expose method-creator & prepared (basic) methods
NfeResource.method = require('./BaseResource.Method');

/**
 * Encapsulates request logic for a NFe.io Resource
 */
function NfeResource(client, urlData) {

  this._client = client;
  this._urlData = urlData || {};

  this.basePath = utils.makeURLInterpolator(this._client.getApiField('basePath'));
  this.path = utils.makeURLInterpolator(this.path);

  this.initialize.apply(this, arguments);

}

NfeResource.prototype = {

  path: '',

  initialize: function() {},

  createFullPath: function(commandPath, urlData) {
    return path.join(
      this.basePath(urlData),
      this.path(urlData),
      typeof commandPath == 'function' ?
        commandPath(urlData) : commandPath
    ).replace(/\\/g, '/'); // ugly workaround for Windows
  },

  createUrlData: function() {
    var urlData = {};
    // Merge in baseData
    for (var i in this._urlData) {
      if (hasOwn.call(this._urlData, i)) {
        urlData[i] = this._urlData[i];
      }
    }
    return urlData;
  },

  createDeferred: function(callback) {
      var deferred = when.defer();

      if (callback) {
        // Callback, if provided, is a simply translated to Promise'esque:
        // (Ensure callback is called outside of promise stack)
        deferred.promise.then(function(res) {
          setTimeout(function(){ callback(null, res) }, 0);
        }, function(err) {
          setTimeout(function(){ callback(err, null); }, 0);
        });
      }

      return deferred;
  },

  _timeoutHandler: function(timeout, req, callback) {
    var self = this;
    return function() {
      var timeoutErr = new Error('ETIMEDOUT');
      timeoutErr.code = 'ETIMEDOUT';

      req._isAborted = true;
      req.abort();

      callback.call(
        self,
        new Error.ConnectionError({
          message: 'Request aborted due to timeout being reached (' + timeout + 'ms)',
          detail: timeoutErr
        }),
        null
      );
    }
  },

  _responseHandler: function(res, callback) {
    var self = this;
      
    return function(res) {
      
      if (res.statusCode === 201 || res.statusCode === 202) {
        callback.call(self, null, {
          code: res.statusCode,
          location: res.headers.location
        });
      }
      
      var data = '';      
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        try {
                  
          var response = JSON.parse(data);          
          response.code = res.statusCode;
          
          if (response.code > 299) {
            var err;
            if (response.code === 401) {
              err = new Error.AuthenticationError(response.message);
            } else {
              err = Error.ResourceError.generate(response);
            }          
            return callback.call(self, err, null);
          }
          
        } catch (e) {
          return callback.call(
            self,
            new Error.APIError({
              message: 'Invalid JSON received from the NFe.io API',
              response: response,
              exception: e
            }),
            null
          );
        }
        callback.call(self, null, response);
      });
    };
  },

  _errorHandler: function(req, callback) {
    var self = this;
    return function(error) {
      if (req._isAborted) return; // already handled
      callback.call(
        self,
        new Error.ConnectionError({
          message: 'An error occurred with our connection to NFe.io',
          detail: error
        }),
        null
      );
    }
  },

  _request: function(method, path, data, auth, callback) {

    var requestData = JSON.stringify(data || {});
    var self = this;

    var apiVersion = this._client.getApiField('version');
    var headers = {      
      // Use specified auth token or use default from this stripe instance:
      'Authorization': auth ?
        'Basic ' + new Buffer(auth) : //'Basic ' + new Buffer(auth + ':').toString('base64') :
        this._client.getApiField('auth'),
      'Accept': 'application/json',
      'User-Agent': 'Nfe-io/v1 NodeBindings/' + this._client.getConstant('PACKAGE_VERSION'),
    };
    
    if (method !== 'GET' && data.formData === undefined)
    {
      headers['Content-Type'] = 'application/json';
      //headers['Content-Length'] = Buffer.byteLength(requestData);
    }
    
    if (apiVersion) {
      headers['Nfe-Version'] = apiVersion;
    }

    // Grab client-user-agent before making the request:
    this._client.getClientUserAgent(function(cua) {
      //headers['X-Nfe-Client-User-Agent'] = cua;
      makeRequest();
    });

    function makeRequest() {

      var timeout = self._client.getApiField('timeout'),
          options = {
            host: self._client.getApiField('host'),
            port: self._client.getApiField('port'),
            path: path,
            method: method,
            headers: headers,
            agent: false,
            rejectUnauthorized: false,
            strictSSL: false
          };
      
      if (data.formData) {
        options.formData = data;
        requestData = undefined;
      }
            
      var req = (
        self._client.getApiField('protocol') == 'http' ? http : https
      ).request(options);

      req.setTimeout(timeout, self._timeoutHandler(timeout, req, callback));
      req.on('response', self._responseHandler(req, callback));
      req.on('error', self._errorHandler(req, callback));

      req.on('socket', function(socket) {
        socket.on('secureConnect', function() {
          if (requestData) {
            req.write(requestData);
          }
          req.end();
        });
      });

    }

  }

};

module.exports = NfeResource;