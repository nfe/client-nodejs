'use strict';

var BaseResource = require('../BaseResource');
var restMethod = BaseResource.method;

module.exports = BaseResource.extend({

  path: '/companies/{company_id}/serviceinvoices',
    
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

  cancel: restMethod({
    method: 'DELETE',
    path: '/{id}',
    urlParams: ['company_id', 'id']
  }),

  sendemail: restMethod({
    method: 'PUT',
    path: '/{id}/sendemail',
    urlParams: ['company_id', 'id']
  }), 

  downloadPdf : restMethod({
    method: 'GET',
    path: '/pdf',
    urlParams: ['company_id']
  }),
  
  downloadXml : restMethod({
    method: 'GET',
    path: '/xml',
    urlParams: ['company_id']
  })

});
