var nfeConfig = {

  // Chave de acesso, você deve copiar exatamente como está no painel.
  apiKey: "api-key-for-access",

  // ID da Empresa, você deve copiar exatamente como está no painel.
  // 	caso você precise acessar mais de uma empresa, este valor não será útil.
  companyId: "company-id-from-panel"

};
var nfe = require('nfe-io')(nfeConfig.apiKey);
var fs = require('fs');

// Upload do certificado digital para uma empresa
nfe.companies.uploadCertificate(
  
  // ID da empresa que foi copiado do painel.
  nfeConfig.companyId,
  
  {
    formData: {

      // Senha do certificado digital
      'password': 'certificate_password',

      // Caminho para o arquivo do certificado digital com extensão PFX ou P12
      'file': fs.createReadStream('path_to_certificate.pfx') 

    }
  },

  function(err, company) {
  
  	if (err) console.log('err', err);
  	if (company) console.log('company', company);
  
  }       
);