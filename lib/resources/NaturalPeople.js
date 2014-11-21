'use strict';

var BaseResource = require('../BaseResource');
var restMethod = BaseResource.method;

module.exports = BaseResource.extend({
  
  path: '/companies/{company_id}/naturalpeople',
  
  create: restMethod({
    method: 'POST',
    urlParams: ['company_id']
  }),

  list: restMethod({
    method: 'GET',    
    urlParams: ['company_id']
  }),

  retrieve: restMethod({
    method: 'GET',
    path: '/{id}',
    urlParams: ['company_id', 'id']
  }),

  update: restMethod({
    method: 'PUT',
    path: '{id}',
    urlParams: ['company_id', 'id']
  }),

  // Avoid 'delete' keyword in JS
  remove: restMethod({
    method: 'DELETE',
    path: '{id}',
    urlParams: ['company_id', 'id']
  })

});
