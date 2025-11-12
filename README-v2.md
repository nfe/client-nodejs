# Cliente Node.JS para emissão de notas fiscais eletrônicas de serviço (NFS-e) - NFE.io 

## Onde eu posso acessar a documentação da API?

> Acesse a [nossa documentação](https://nfe.io/docs/nota-fiscal-servico/integracao-nfs-e/) para mais detalhes ou acessa a [referência da API](https://nfe.io/doc/rest-api/nfe-v1/).

## Como realizar a instalação do pacote?

Nosso pacote é uma dependencia do NPM, e pode ser encontrado no [https://www.npmjs.com/package/nfe-io](https://www.npmjs.com/package/nfe-io)
Para utilizar nosso pacote, utilize o comando abaixo para instalar:

``` bash
    npm install nfe-io
```

## Exemplo de utilização

Depois de baixar o pacote, inclua a dependência em seu arquivo JS, utilizando o código abaixo:

```js
// Chave de acesso deve ser copiada do painel.
var nfe = require('nfe-io')('chave-de-acesso-na-api');

// Exemplo genérico
// nfe.{ RESOURCE_NAME }.{ METHOD_NAME } ( { PARAMETERS, DATA }, { CALLBACK_FUNCTION } )
```
>**Observação:**Todo método aceita um callback opcional como ultimo argumento.

### Como emitir uma Nota Fiscal de Serviço?
Abaixo, temos um código-exemplo para realizar uma Emissão de Nota Fiscal de Serviço:

```js
var nfe = require('nfe-io')('chave-de-acesso-na-api');

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
### Como cancelar uma nota?
>Em construção!


### Como criar uma empresa para realizar a emissão de notas fiscais?
Abaixo, temos um código-exemplo de criação de uma empresa, para realizar a emissão de nota fiscal:

```js
var nfe = require('nfe-io')('chave-de-acesso-na-api');

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
    //   Opções: ['Automatico', 'Nenhum', 'MicroempresaMunicipal', 'Estimativa', 'SociedadeDeProfissionais', 'Cooperativa', 'MicroempreendedorIndividual', 'MicroempresarioEmpresaPequenoPorte']
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

### Como efetuar o download de uma nota em PDF?
>Em construção!

### Como validar o Webhook?
>Em construção!

## Configurações 

### Tempo limite para requisições
`nfe.setTimeout(20000); // in ms` (node's default: `120000ms`);
 
### Chave de acesso
`nfe.setApiKey('c73d49f9-6490-46ee-ba36-dcf69f6334fd');` 

## Como testar a aplicação?
Para executar testes, utilize o comando :
``` bash
npm test
```
