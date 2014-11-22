var nfeConfig = {

  // Chave de acesso, você deve copiar exatamente como está no painel.
  apiKey: "api-key-for-access",

  // ID da Empresa, você deve copiar exatamente como está no painel.
  // 	caso você precise acessar mais de uma empresa, este valor não será útil.
  companyId: "company-id-from-panel"

};
var nfe = require('nfe-io')(nfeConfig.apiKey);

// Criar uma pessoa jurídica
nfe.legalPeople.create(
  
  // ID da empresa que foi copiado do painel.
  nfeConfig.companyId,

  // Dados da pessoa jurídica
  {
    // CNPJ ou CPF (opcional para tomadores no exterior)
    'federalTaxNumber': 00000000000191,

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
  },

  function(err, legalPeople) {
    
    if (err) console.log('err', err);
    if (legalPeople) console.log('legalPeople', legalPeople);
    
  }
);