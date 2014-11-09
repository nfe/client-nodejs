# NFe.io para Node.js [![Build Status](https://travis-ci.org/nfeio/nfe-node.png?branch=master)](https://travis-ci.org/nfeio/nfe-node)

## Instalação

`npm install nfe-io`

## Exemplo de Uso
```js
var nfe = require('iugu')('c73d49f9-6490-46ee-ba36-dcf69f6334fd'); // Ache sua chave API no Painel
// nfe.{ RESOURCE_NAME }.{ METHOD_NAME }
```
Todo método aceita um callback opcional como ultimo argumento:

### Criar uma Pessoa Jurídica
```js
nfe.legalpeople.create(
  'c73d49f9649046eeba36', // ID da Empresa, ache no painel, nosso sistema é multi empresas :)
  {
  name: 'BANCO DO BRASIL SA',
  email: 'exemplo@bb.com.br',
  address: {
    country: 'BRA',
    postalCode: '70073-901',
    street: 'Outros Quadra 1 Bloco G Lote 32',
    number: 'S/N',
    additionalInformation: 'QUADRAQUADRA 01 BLOCO G',
    district: 'Asa Sul',
    city: {
      code: '5300108',
      name: 'Brasilia'
    },
    state: 'DF'
  }
  }, function(err, entity) {
    err; // null se não ocorreu nenhum erro
    entity; // O objeto de retorno da criação
  }
);
```

### Emitir uma Nota Fiscal de Serviço
```js
nfe.serviceInvoices.create(
  'c73d49f9649046eeba36', // ID da Empresa, ache no painel, nosso sistema é multi empresas :)
  {  
    borrower: {
        name: 'BANCO DO BRASIL SA',
        federalTaxNumber: 00000000000191, // opcional
        email: 'exemplo@bb.com.br',
        address: {
          country: 'BRA',
          postalCode: '70073-901', // opcional 
          street: 'Outros Quadra 1 Bloco G Lote 32',
          number: 'S/N', // opcional 
          additionalInformation: 'QUADRAQUADRA 01 BLOCO G', // opcional
          district: 'Asa Sul',
          city: {
            code: '5300108', // opcional
            name: 'Brasilia' // opcional 
          },
          state: 'DF' // opcional
        }
    },
    cityServiceCode: '2690', // código de serviço de acordo com a cidade
    description: 'Prestação de serviços de desenvolvimento de sistemas.',
    servicesAmount:  0.01
  }, function(err, invoice) {    
    err; // null se não ocorreu nenhum erro
    invoice; // O objeto de retorno da emissão    
  }
);
```

## Documentação
Acesse [api.nfe.io/docs](http://api.nfe.io/swagger) para mais informações

## Configuração

 * `nfe.setApiKey('c73d49f9-6490-46ee-ba36-dcf69f6334fd');`
 * `nfe.setTimeout(20000); // in ms` (node's default: `120000ms`)

## Testes
Execute :

`npm test`

## Autor

Originalmente por [NFe.io](https://github.com/nfeio).
