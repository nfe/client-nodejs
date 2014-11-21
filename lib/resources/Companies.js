'use strict';

var BaseResource = require('../BaseResource');
var restMethod = BaseResource.method;

module.exports = BaseResource.extend({
  
  path: '/companies',
  
  create: restMethod({
    method: 'POST'
  }),

  list: restMethod({
    method: 'GET'
  }),

  retrieve: restMethod({
    method: 'GET',
    path: '/{id}',
    urlParams: ['id']
  }),

  update: restMethod({
    method: 'PUT',
    path: '{id}',
    urlParams: ['id']
  }),

  // Avoid 'delete' keyword in JS
  remove: restMethod({
    method: 'DELETE',
    path: '{id}',
    urlParams: ['id']
  }),
    
  uploadCertificate: restMethod({
    method: 'POST',
    path: '{id}/certificate',
    urlParams: ['id']
  })

});
