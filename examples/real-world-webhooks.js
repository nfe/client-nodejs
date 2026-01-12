/**
 * Exemplo Real - Configuração de Webhooks
 *
 * Este exemplo demonstra:
 * - Criar webhook para receber eventos de notas fiscais
 * - Listar webhooks configurados
 * - Atualizar configuração de webhook
 * - Validar assinatura de webhook
 */

import { NfeClient } from '../dist/index.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const apiKey = process.env.NFE_API_KEY;
const environment = process.env.NFE_TEST_ENVIRONMENT || 'development';

if (!apiKey) {
  console.error('❌ NFE_API_KEY não encontrada no .env.test');
  process.exit(1);
}

const nfe = new NfeClient({ apiKey, environment });

console.log('🔗 NFE.io SDK v3 - Configuração de Webhooks');
console.log('═'.repeat(70));

async function configurarWebhooks() {
  try {
    // 1. Buscar empresa
    console.log('\n📋 1. Buscando empresa...');
    const empresas = await nfe.companies.list();

    if (!empresas.data || empresas.data.length === 0) {
      console.error('❌ Nenhuma empresa encontrada');
      return;
    }

    const empresa = empresas.data[0];
    console.log(`✅ Empresa: ${empresa.name}`);

    // 2. Listar webhooks existentes
    console.log('\n📋 2. Listando webhooks configurados...');
    const webhooks = await nfe.webhooks.list(empresa.id);

    if (webhooks.data && webhooks.data.length > 0) {
      console.log(`✅ ${webhooks.data.length} webhook(s) encontrado(s):`);
      webhooks.data.forEach((webhook, index) => {
        console.log(`   ${index + 1}. URL: ${webhook.url}`);
        console.log(`      Status: ${webhook.active ? 'Ativo' : 'Inativo'}`);
        console.log(`      Eventos: ${webhook.events?.join(', ') || 'N/A'}`);
        console.log('      ' + '─'.repeat(60));
      });
    } else {
      console.log('⚠️  Nenhum webhook configurado ainda');
    }

    // 3. Criar novo webhook (ou usar existente)
    console.log('\n📋 3. Configurando webhook...');

    // IMPORTANTE: Substitua esta URL pela URL real do seu endpoint
    const webhookUrl = 'https://seu-servidor.com.br/api/webhooks/nfe';

    console.log(`⚠️  ATENÇÃO: Usando URL de exemplo: ${webhookUrl}`);
    console.log('   Para produção, substitua pela URL real do seu servidor!');

    let webhook;
    const webhookExistente = webhooks.data?.find(w => w.url === webhookUrl);

    if (webhookExistente) {
      console.log('✅ Webhook já existe, usando configuração existente');
      webhook = webhookExistente;
    } else {
      console.log('⚠️  Criando novo webhook...');

      try {
        webhook = await nfe.webhooks.create(empresa.id, {
          url: webhookUrl,
          events: [
            'invoice.issued',
            'invoice.cancelled',
            'invoice.error'
          ],
          active: true
        });

        console.log('✅ Webhook criado com sucesso!');
        console.log(`   ID: ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Eventos: ${webhook.events?.join(', ')}`);
      } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 409) {
          console.warn('⚠️  Webhook já existe ou URL inválida');
          console.warn('   Continue para ver exemplo de validação de assinatura');
        } else {
          throw error;
        }
      }
    }

    // 4. Demonstrar atualização de webhook (se temos um webhook)
    if (webhook && webhook.id) {
      console.log('\n📋 4. Exemplo de atualização de webhook...');
      console.log('   (não executado neste exemplo, mas o código está disponível)');
      console.log('\n   Código para atualizar:');
      console.log(`   await nfe.webhooks.update('${empresa.id}', '${webhook.id}', {`);
      console.log(`     events: ['invoice.issued', 'invoice.cancelled']`);
      console.log(`   });`);
    }

    // 5. Demonstrar validação de assinatura de webhook
    console.log('\n📋 5. Exemplo de validação de assinatura de webhook:');
    console.log('═'.repeat(70));

    // Exemplo de payload que você receberá no seu endpoint
    const examplePayload = {
      event: 'invoice.issued',
      data: {
        id: 'nota-fiscal-id-123',
        number: '12345',
        status: 'issued',
        servicesAmount: 1500.00,
        borrower: {
          name: 'Cliente Exemplo',
          email: 'cliente@exemplo.com.br'
        }
      },
      timestamp: new Date().toISOString()
    };

    // Assinatura que viria no header X-NFE-Signature
    const exampleSignature = 'sha256=abc123def456...';

    // Seu segredo compartilhado (defina no painel NFE.io)
    const webhookSecret = 'seu-segredo-webhook';

    console.log('\n📝 Exemplo de payload recebido:');
    console.log(JSON.stringify(examplePayload, null, 2));

    console.log('\n🔐 Validação de assinatura:');
    console.log('```javascript');
    console.log('// No seu servidor Express, por exemplo:');
    console.log('app.post("/api/webhooks/nfe", (req, res) => {');
    console.log('  const signature = req.headers["x-nfe-signature"];');
    console.log('  const payload = req.body;');
    console.log('  ');
    console.log('  // Validar assinatura');
    console.log('  const isValid = nfe.webhooks.validateSignature(');
    console.log('    payload,');
    console.log('    signature,');
    console.log(`    "${webhookSecret}"`);
    console.log('  );');
    console.log('  ');
    console.log('  if (!isValid) {');
    console.log('    return res.status(401).json({ error: "Assinatura inválida" });');
    console.log('  }');
    console.log('  ');
    console.log('  // Processar evento');
    console.log('  const { event, data } = payload;');
    console.log('  ');
    console.log('  switch (event) {');
    console.log('    case "invoice.issued":');
    console.log('      console.log("Nota fiscal emitida:", data.id);');
    console.log('      // Sua lógica aqui');
    console.log('      break;');
    console.log('    ');
    console.log('    case "invoice.cancelled":');
    console.log('      console.log("Nota fiscal cancelada:", data.id);');
    console.log('      // Sua lógica aqui');
    console.log('      break;');
    console.log('    ');
    console.log('    case "invoice.error":');
    console.log('      console.error("Erro ao emitir nota:", data.error);');
    console.log('      // Sua lógica de tratamento de erro');
    console.log('      break;');
    console.log('  }');
    console.log('  ');
    console.log('  res.status(200).json({ received: true });');
    console.log('});');
    console.log('```');

    // 6. Tipos de eventos disponíveis
    console.log('\n📋 6. Eventos disponíveis para webhooks:');
    console.log('═'.repeat(70));
    console.log('   • invoice.issued       - Nota fiscal emitida com sucesso');
    console.log('   • invoice.cancelled    - Nota fiscal cancelada');
    console.log('   • invoice.error        - Erro ao processar nota fiscal');
    console.log('   • invoice.authorized   - Nota fiscal autorizada pela prefeitura');
    console.log('   • invoice.rejected     - Nota fiscal rejeitada pela prefeitura');

    // 7. Melhores práticas
    console.log('\n💡 Melhores Práticas para Webhooks:');
    console.log('═'.repeat(70));
    console.log('   1. ✅ Sempre valide a assinatura do webhook');
    console.log('   2. ✅ Use HTTPS na URL do webhook (obrigatório)');
    console.log('   3. ✅ Responda rapidamente (< 5 segundos)');
    console.log('   4. ✅ Processe de forma assíncrona se necessário');
    console.log('   5. ✅ Implemente retry logic para processamento');
    console.log('   6. ✅ Registre (log) todos os eventos recebidos');
    console.log('   7. ✅ Implemente idempotência (evite processar 2x)');
    console.log('   8. ✅ Monitore falhas e ajuste configurações');

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Configuração de webhooks demonstrada com sucesso!');
    console.log('═'.repeat(70));
    console.log('\n📝 Próximos passos:');
    console.log('   1. Implemente um endpoint HTTPS para receber webhooks');
    console.log('   2. Configure a URL real no código acima');
    console.log('   3. Execute novamente para criar o webhook');
    console.log('   4. Teste emitindo uma nota fiscal');

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:');
    console.error(`   Tipo: ${error.constructor.name}`);
    console.error(`   Mensagem: ${error.message}`);

    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }

    if (error.details) {
      console.error(`   Detalhes:`, JSON.stringify(error.details, null, 2));
    }

    process.exit(1);
  }
}

configurarWebhooks();
