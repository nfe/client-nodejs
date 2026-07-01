/**
 * NFE.io SDK v5 - Webhooks de conta (Account-scoped Webhooks)
 *
 * Diferente dos webhooks por empresa (`/companies/{id}/webhooks`), estes são da
 * CONTA inteira (host-root `/v2/webhooks`, sem companyId). Inclui `fetchEventTypes`
 * (lista de tipos de evento AO VIVO — fonte da verdade é o servidor).
 *
 *   node examples/account-webhooks.js
 */

import { NfeClient } from '../dist/index.js';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY, environment: 'development' });

async function main() {
  if (!process.env.NFE_API_KEY) {
    console.error('Defina NFE_API_KEY.');
    process.exit(1);
  }

  try {
    console.log('\n📡 Tipos de evento disponíveis (ao vivo)');
    const eventTypes = await nfe.webhooks.fetchEventTypes();
    console.log(`  ${eventTypes.length} tipos, ex.: ${eventTypes.slice(0, 5).join(', ')}`);

    console.log('\n🌐 Webhooks de conta');
    const { data: hooks } = await nfe.webhooks.listAccountWebhooks();
    console.log(`  ${hooks.length} webhook(s) de conta`);

    // Criar um webhook de conta:
    // const created = await nfe.webhooks.createAccountWebhook({
    //   uri: 'https://seu-site.com/webhook',
    //   events: eventTypes.slice(0, 2),
    // });
    // await nfe.webhooks.pingAccountWebhook(created.id);   // dispara um ping de teste
    // await nfe.webhooks.deleteAccountWebhook(created.id);
    //
    // ⚠️ deleteAllAccountWebhooks() remove TODOS os webhooks da conta — use com cuidado.
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
