'use strict';

Nfe.DEFAULT_HOST = 'api.nfe.io';
Nfe.DEFAULT_PORT = '443';
Nfe.DEFAULT_PROTOCOL = Nfe.DEFAULT_PORT === '443' ? 'https' : 'http';
Nfe.DEFAULT_BASE_PATH = '/v1/';
Nfe.DEFAULT_API_VERSION = null;

// Use node's default timeout:
Nfe.DEFAULT_TIMEOUT = require('http').createServer().timeout;

Nfe.PACKAGE_VERSION = require('../package.json').version;

Nfe.USER_AGENT = {
  bindings_version: Nfe.PACKAGE_VERSION,
  lang: 'node',
  lang_version: process.version,
  platform: process.platform,
  publisher: 'nfe',
  uname: null
};

Nfe.USER_AGENT_SERIALIZED = null;

var exec = require('child_process').exec;

var resources = {
  
  Companies: require('./resources/Companies'),
  Webhooks: require('./resources/Webhooks'),
    
  LegalPeople: require('./resources/LegalPeople'),
  NaturalPeople: require('./resources/NaturalPeople'),
  
  ServiceInvoices: require('./resources/ServiceInvoices')
  
};

Nfe.baseResource = require('./BaseResource');
Nfe.resources = resources;

function Nfe(key, version) {

  if (!(this instanceof Nfe)) {
    return new Nfe(key, version);
  }

  this._api = {
    auth: null,
    host: Nfe.DEFAULT_HOST,
    protocol: Nfe.DEFAULT_PROTOCOL,
    port: Nfe.DEFAULT_PORT,
    basePath: Nfe.DEFAULT_BASE_PATH,
    version: Nfe.DEFAULT_API_VERSION,
    timeout: Nfe.DEFAULT_TIMEOUT,
    dev: false
  };

  this._prepResources();
  this.setApiKey(key);
  this.setApiVersion(version);
}

Nfe.prototype = {

  setHost: function(host, port, protocol) {
    this._setApiField('host', host);
    if (port) this.setPort(port);
    if (protocol) this.setProtocol(protocol);
  },

  setProtocol: function(protocol) {
    this._setApiField('protocol', protocol.toLowerCase());
  },

  setPort: function(port) {
    this._setApiField('port', port);
  },

  setApiVersion: function(version) {
    if (version) {
      this._setApiField('version', version);
    }
  },

  setApiKey: function(key) {
    if (key) {
      this._setApiField(
        'auth',
        'Basic ' + new Buffer(key)
        // 'Basic ' + new Buffer(key + ':').toString('base64')
      );
    }
  },

  setTimeout: function(timeout) {
    this._setApiField(
      'timeout',
      timeout == null ? Nfe.DEFAULT_TIMEOUT : timeout
    );
  },

  _setApiField: function(key, value) {
    this._api[key] = value;
  },

  getApiField: function(key) {
    return this._api[key];
  },

  getConstant: function(c) {
    return Nfe[c];
  },

  getClientUserAgent: function(cb) {
    if (Nfe.USER_AGENT_SERIALIZED) {
      return cb(Nfe.USER_AGENT_SERIALIZED);
    }
    exec('uname -a', function(err, uname) {
      Nfe.USER_AGENT.uname = uname || 'UNKNOWN';
      Nfe.USER_AGENT_SERIALIZED = JSON.stringify(Nfe.USER_AGENT);
      cb(Nfe.USER_AGENT_SERIALIZED);
    });
  },

  _prepResources: function() {
    for (var name in resources) {
      this[
        name[0].toLowerCase() + name.substring(1)
      ] = new resources[name](this);
    }
  }

};

module.exports = Nfe;
