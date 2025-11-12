/**
 * NFE.io SDK v3 - Basic Usage Example
 * Demonstrates core functionality without Node.js specific APIs
 */

// Import usando ESM syntax
import { createNfeClient, isEnvironmentSupported, getRuntimeInfo } from '../dist/index.js';

// Verificar compatibilidade do ambiente
console.log('🔍 Verificando compatibilidade do ambiente...');
const supported = isEnvironmentSupported();
console.log('Ambiente suportado:', supported);

if (!supported.supported) {
  console.error('❌ Ambiente não suportado:', supported.issues);
  // process?.exit?.(1);
} else {
  console.log('✅ Ambiente compatível!');
}

// Obter informações do runtime
console.log('\n📊 Informações do runtime:');
const runtimeInfo = getRuntimeInfo();
console.log(runtimeInfo);

// Configurar cliente (usando sandbox)
console.log('\n🚀 Criando cliente NFE.io...');
const nfe = createNfeClient({
  apiKey: 'sua-api-key-aqui',
  environment: 'sandbox',
  timeout: 10000,
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000
  }
});

console.log('✅ Cliente criado com sucesso!');

// Exemplo de uso (comentado pois precisa de API key real)
console.log('\n📋 Exemplos de uso:');
console.log('// Listar empresas');
console.log('// const companies = await nfe.companies.list();');
console.log('// console.log(`Encontradas ${companies.companies.length} empresas`);');

console.log('\n// Criar uma nota fiscal de serviço');
console.log(`// const invoice = await nfe.serviceInvoices.create('company-id', {
//   cityServiceCode: '12345',
//   description: 'Desenvolvimento de software',
//   servicesAmount: 1500.00,
//   borrower: {
//     federalTaxNumber: '12345678901',
//     name: 'Cliente Exemplo',
//     email: 'cliente@exemplo.com',
//     address: {
//       street: 'Rua Exemplo, 123',
//       neighborhood: 'Centro',
//       city: { code: '3550308', name: 'São Paulo' },
//       state: 'SP',
//       postalCode: '01000-000'
//     }
//   }
// });`);

console.log('\n// Aguardar processamento assíncrono');
console.log(`// const finalInvoice = await nfe.serviceInvoices.createAndWait(
//   'company-id',
//   invoiceData,
//   { maxAttempts: 10, interval: 2000 }
// );`);

console.log('\n✨ SDK v3 inicializado com sucesso!');