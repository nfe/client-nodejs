# NFe.io para Node.js [![Build Status](https://travis-ci.org/nfe/client-nodejs.svg?branch=master)](https://travis-ci.org/nfe/client-nodejs)

## Instalação

`npm install nfe-io`

## Exemplo de Uso
```js
// Chave de acesso deve ser copiada do painel.
var nfe = require('nfe-io')('chave-de-acesso-na-api');

// Exemplo genérico
// nfe.{ RESOURCE_NAME }.{ METHOD_NAME } ( { PARAMETERS, DATA }, { CALLBACK_FUNCTION } )
```
Todo método aceita um callback opcional como ultimo argumento:

### Emitir uma Nota Fiscal de Serviço
```js
nfe.serviceInvoices.create(
  
  // ID da empresa, você deve copiar exatamente como está no painel
  'c73d49f9649046eeba36', 
  
  // Dados da nota fiscal de serviço
  {  
    // Código do serviço de acordo com o a cidade
    'cityServiceCode': '2690',
    
    // Descrição dos serviços prestados
    'description': 'TESTE EMISSAO',  

    // Valor total do serviços
    'servicesAmount':  0.01,

    // Dados do Tomador dos Serviços
    'borrower': {  

      // Tipo do tomador dos serviços, 
      //    opções: 'Undefined', 'NaturalPerson', 'LegalEntity'
      'type': 'LegalEntity',

      // CNPJ ou CPF em números (opcional para tomadores no exterior)
      'federalTaxNumber': 191,

      // Nome da pessoa física ou Razão Social da Empresa
      'name': 'BANCO DO BRASIL SA',
      
      // Email para onde deverá ser enviado a nota fiscal
      'email': 'exemplo@bb.com.br',

      // Endereço do tomador
      'address': {
      	
      	// Código do pais com três letras
        'country': 'BRA',
        
        // CEP do endereço (opcional para tomadores no exterior)
        'postalCode': '70073901',
         
        // Logradouro
        'street': 'Outros Quadra 1 Bloco G Lote 32',
        
        // Número (opcional)
        'number': 'S/N',
        
        // Complemento (opcional) 
        'additionalInformation': 'QUADRA 01 BLOCO G',

        // Bairro
        'district': 'Asa Sul', 

		// Cidade é opcional para tomadores no exterior
        'city': { 
            // Código do IBGE para a Cidade
            'code': '5300108',
            // Nome da Cidade
            'name': 'Brasilia'
        },

        // Sigla do estado (opcional para tomadores no exterior)
        'state': 'DF'
        
      }
  }, function(err, invoice) {    
    err; // null se não ocorreu nenhum erro
    invoice; // O objeto de retorno da emissão    
  }
);
```

### Criar uma Empresa para Emissão de Notas
```js
nfe.companies.create(
  // Dados da pessoa jurídica
  {
    // CNPJ ou CPF (opcional para tomadores no exterior)
    // Atenção: Somente números sem zeros a esquerda
    'federalTaxNumber': 191, 

    // Nome da pessoa física ou Razão Social da Empresa
    'name': 'BANCO DO BRASIL SA',
    
    // Nome fantasia, esse nome será usado no assunto do email
    'tradeName': 'BANCO DO BRASIL SA',
        
    // Número de Inscricação na Prefeitura (CCM) 
    'municipalTaxNumber': '12345',
    
    // Tipo do Regime Tributário
    //   Opções: 'Isento', 'MicroempreendedorIndividual', 'SimplesNacional', 'LucroPresumido', 'LucroReal'
    'taxRegime': 'SimplesNacional'
    
    // Tipo do regime especial de tributação
    //   Opções: ['Automatico', 'Nenhum', 'MicroempresaMunicipal', 'Estimativa', 'SociedadeDeProfissionais', 'Cooperativa', 'MicroempreendedorIndividual', 'MicroempresarioEmpresaPequenoPorte']
    'specialTaxRegime': 'Nenhum',

    // Endereço do tomador
    'address': {
      
      // Código do pais com três letras
      'country': 'BRA',
      
      // CEP do endereço (opcional para tomadores no exterior)
      'postalCode': '70073901',
       
      // Logradouro
      'street': 'Outros Quadra 1 Bloco G Lote 32',
      
      // Número (opcional)
      'number': 'S/N',
      
      // Complemento (opcional) 
      'additionalInformation': 'QUADRA 01 BLOCO G',

      // Bairro
      'district': 'Asa Sul', 

      // Cidade é opcional para tomadores no exterior
      'city': { 
          // Código do IBGE para a Cidade
          'code': '5300108',
          // Nome da Cidade
          'name': 'Brasilia'
      },

      // Sigla do estado (opcional para tomadores no exterior)
      'state': 'DF'
      
    }
  }, function(err, entity) {
    err; // null se não ocorreu nenhum erro
    entity; // O objeto de retorno da criação
  }
);
```

### Exemplo para Listagem
```js
// Chave de acesso deve ser copiada do painel.
var nfe = require('nfe-io')('COLOQUE_AQUI_SUA_CHAVE_API');

// listar as empresas
nfe.companies.list(function(err, res) {
    var company = res.companies[0];
    var id = company.id;
    var name = company.name;
        
    console.log(id, name);

    // lista as notas fiscais
    nfe.serviceInvoices.list(id, function(err, res) {

        if (err) {
            console.error(err);
            return;            
        }

        if (res.code === 200) { // retorno OK?
            // primeira nota fiscal
            var firstServiceInvoice = res.serviceInvoices[0];

            console.log(firstServiceInvoice);
        }
    });
});
```

## Documentação

Acesse [https://api.nfe.io](https://api.nfe.io) para mais detalhes e referências.

## Configurações 

#### Tempo limite para requisições
 * `nfe.setTimeout(20000); // in ms` (node's default: `120000ms`);
 
#### Chave de acesso
 * `nfe.setApiKey('c73d49f9-6490-46ee-ba36-dcf69f6334fd');` 

## Testes
Execute :

`npm test`

## Autor

Originalmente criado pela equipe da [NFe.io](https://github.com/nfe).
