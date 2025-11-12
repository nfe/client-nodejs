/**
 * NFE.io SDK v3 - CommonJS Usage Example
 * Demonstrates core functionality using require()
 */

// Import usando CommonJS syntax
const { createNfeClient, isEnvironmentSupported, getRuntimeInfo } = require('../dist/index.cjs');

async function demonstrateSDK() {
  try {
    // Verificar compatibilidade do ambiente
    console.log('🔍 Verificando compatibilidade do ambiente...');
    const supported = isEnvironmentSupported();
    console.log('Ambiente suportado:', supported);

    if (!supported) {
      console.error('❌ Ambiente não suportado!');
      return;
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

    // Demonstrar estrutura de resources
    console.log('\n📚 Resources disponíveis:');
    console.log('- nfe.companies: Gerenciamento de empresas');
    console.log('- nfe.serviceInvoices: Notas fiscais de serviço');
    console.log('- nfe.legalPeople: Pessoas jurídicas');
    console.log('- nfe.naturalPeople: Pessoas físicas');
    console.log('- nfe.webhooks: Gerenciamento de webhooks');

    // Exemplo de validação de dados (sem fazer chamada real)
    console.log('\n🔍 Exemplo de validação de dados:');
    
    const exampleInvoiceData = {
      cityServiceCode: '12345',
      description: 'Desenvolvimento de software personalizado',
      servicesAmount: 2500.00,
      borrower: {
        federalTaxNumber: '12345678901',
        name: 'Empresa Cliente Ltda',
        email: 'contato@cliente.com.br',
        address: {
          street: 'Av. Paulista, 1000',
          neighborhood: 'Bela Vista',
          city: { code: '3550308', name: 'São Paulo' },
          state: 'SP',
          postalCode: '01310-100'
        }
      }
    };
    
    console.log('Dados da nota fiscal:', JSON.stringify(exampleInvoiceData, null, 2));
    
    console.log('\n📋 Fluxo típico de uma nota fiscal:');
    console.log('1. Criar nota: POST /companies/{id}/serviceinvoices');
    console.log('2. Receber 202 (processamento assíncrono)');
    console.log('3. Fazer polling até conclusão');
    console.log('4. Baixar PDF/XML quando emitida');

    console.log('\n✨ Demonstração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante demonstração:', error.message);
  }
}

// Executar demonstração
demonstrateSDK();