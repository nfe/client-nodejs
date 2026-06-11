/**
 * NFE.io SDK v3 - Exemplo Completo com Todos os Resources
 * Demonstra o uso de todos os recursos disponíveis
 */

import { createNfeClient } from '../dist/index.js';

async function demonstrateAllResources() {
  // Criar cliente
  const nfe = createNfeClient({
    apiKey: 'sua-api-key-aqui',
    environment: 'development'
  });

  console.log('🚀 NFE.io SDK v3 - Demonstração Completa\n');

  try {
    // ========================================================================
    // 1. COMPANIES (Empresas)
    // ========================================================================
    console.log('1️⃣  COMPANIES - Gerenciamento de Empresas');
    console.log('─'.repeat(50));

    // Listar empresas
    console.log('Listando empresas...');
    // const companies = await nfe.companies.list();
    // console.log(`✓ Encontradas ${companies.data.length} empresa(s)\n`);

    // Criar empresa (exemplo comentado)
    console.log('Exemplo de criação:');
    console.log(`
const company = await nfe.companies.create({
  name: 'Minha Empresa Ltda',
  federalTaxNumber: '12345678901234',
  email: 'contato@empresa.com',
  address: {
    street: 'Av. Paulista, 1000',
    neighborhood: 'Bela Vista',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP',
    postalCode: '01310-100'
  }
});
    `);

    // ========================================================================
    // 2. SERVICE INVOICES (Notas Fiscais)
    // ========================================================================
    console.log('\n2️⃣  SERVICE INVOICES - Notas Fiscais de Serviço');
    console.log('─'.repeat(50));

    console.log('Funcionalidades disponíveis:');
    console.log('✓ create() - Criar nota fiscal');
    console.log('✓ createAndWait() - Criar e aguardar processamento');
    console.log('✓ list() - Listar notas');
    console.log('✓ retrieve() - Buscar nota específica');
    console.log('✓ cancel() - Cancelar nota');
    console.log('✓ sendEmail() - Enviar por email');
    console.log('✓ downloadPdf() - Download PDF');
    console.log('✓ downloadXml() - Download XML\n');

    console.log('Exemplo de emissão com polling automático:');
    console.log(`
const invoice = await nfe.serviceInvoices.createAndWait(
  'company-id',
  {
    cityServiceCode: '2690',
    description: 'Desenvolvimento de software',
    servicesAmount: 1500.00,
    borrower: {
      federalTaxNumber: '12345678901',
      name: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      address: { /* ... */ }
    }
  },
  { maxAttempts: 10, interval: 2000 }
);
    `);

    // ========================================================================
    // 3. LEGAL PEOPLE (Pessoas Jurídicas)
    // ========================================================================
    console.log('\n3️⃣  LEGAL PEOPLE - Pessoas Jurídicas');
    console.log('─'.repeat(50));

    console.log('Operações CRUD completas (scoped por company):');
    console.log('✓ list(companyId) - Listar');
    console.log('✓ create(companyId, data) - Criar');
    console.log('✓ retrieve(companyId, id) - Buscar');
    console.log('✓ update(companyId, id, data) - Atualizar');
    console.log('✓ delete(companyId, id) - Deletar');
    console.log('✓ createBatch(companyId, data[]) - Criar em lote');
    console.log('✓ findByTaxNumber(companyId, cnpj) - Buscar por CNPJ\n');

    console.log('Exemplo:');
    console.log(`
const legalPerson = await nfe.legalPeople.create('company-id', {
  federalTaxNumber: '12345678901234',
  name: 'Empresa Cliente Ltda',
  email: 'contato@cliente.com.br',
  address: { /* ... */ }
});
    `);

    // ========================================================================
    // 4. NATURAL PEOPLE (Pessoas Físicas)
    // ========================================================================
    console.log('\n4️⃣  NATURAL PEOPLE - Pessoas Físicas');
    console.log('─'.repeat(50));

    console.log('Operações CRUD completas (scoped por company):');
    console.log('✓ list(companyId) - Listar');
    console.log('✓ create(companyId, data) - Criar');
    console.log('✓ retrieve(companyId, id) - Buscar');
    console.log('✓ update(companyId, id, data) - Atualizar');
    console.log('✓ delete(companyId, id) - Deletar');
    console.log('✓ createBatch(companyId, data[]) - Criar em lote');
    console.log('✓ findByTaxNumber(companyId, cpf) - Buscar por CPF\n');

    console.log('Exemplo:');
    console.log(`
const naturalPerson = await nfe.naturalPeople.create('company-id', {
  federalTaxNumber: '12345678901',
  name: 'João Silva',
  email: 'joao@exemplo.com',
  address: { /* ... */ }
});
    `);

    // ========================================================================
    // 5. WEBHOOKS
    // ========================================================================
    console.log('\n5️⃣  WEBHOOKS - Notificações de Eventos');
    console.log('─'.repeat(50));

    console.log('Funcionalidades:');
    console.log('✓ list(companyId) - Listar webhooks');
    console.log('✓ create(companyId, data) - Criar webhook');
    console.log('✓ retrieve(companyId, id) - Buscar webhook');
    console.log('✓ update(companyId, id, data) - Atualizar');
    console.log('✓ delete(companyId, id) - Deletar');
    console.log('✓ test(companyId, id) - Testar webhook');
    console.log('✓ validateSignature() - Validar assinatura');
    console.log('✓ getAvailableEvents() - Eventos disponíveis\n');

    console.log('Exemplo de criação:');
    console.log(`
const webhook = await nfe.webhooks.create('company-id', {
  url: 'https://seu-site.com/webhook/nfe',
  events: ['invoice.issued', 'invoice.cancelled'],
  secret: 'sua-chave-secreta'
});
    `);

    console.log('\nExemplo de validação de assinatura (HMAC-SHA1 sobre o body cru):');
    console.log(`
// IMPORTANTE: use express.raw() para receber os bytes exatos que a NFE.io assinou.
// JSON.stringify(req.body) NÃO funciona — a ordem das propriedades pode diferir.
app.post('/webhook/nfe', express.raw({ type: '*/*' }), (req, res) => {
  const ok = nfe.webhooks.validateSignature(
    req.body,                                    // Buffer com os bytes exatos
    req.headers['x-hub-signature'],              // header correto (não 'x-nfe-signature')
    process.env.NFE_WEBHOOK_SECRET ?? ''
  );

  if (!ok) {
    return res.status(401).end();
  }

  const event = JSON.parse(req.body.toString('utf8'));
  // Processar evento...
  res.status(204).end();
});
    `);

    console.log('\nEventos disponíveis:');
    const events = nfe.webhooks.getAvailableEvents();
    events.forEach(event => console.log(`  • ${event}`));

    // ========================================================================
    // RESUMO
    // ========================================================================
    console.log('\n\n📊 RESUMO DO SDK');
    console.log('═'.repeat(50));
    console.log('✅ 5 Resources implementados:');
    console.log('   1. Companies');
    console.log('   2. ServiceInvoices');
    console.log('   3. LegalPeople');
    console.log('   4. NaturalPeople');
    console.log('   5. Webhooks');
    console.log('\n✅ Features:');
    console.log('   • TypeScript nativo com types completos');
    console.log('   • Zero runtime dependencies');
    console.log('   • Async/await API moderna');
    console.log('   • Retry automático com exponential backoff');
    console.log('   • Polling inteligente para async operations');
    console.log('   • Error handling tipado');
    console.log('   • Suporte ESM + CommonJS');
    console.log('\n✅ Pronto para produção! 🚀\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar demonstração
demonstrateAllResources();
