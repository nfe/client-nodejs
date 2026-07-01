/**
 * NFE.io SDK v5 - Notificações (Notifications)
 *
 * Notificações da empresa (host api.nfe.io): listar, obter, remover e enviar e-mail.
 *
 *   node examples/notifications.js
 */

import { NfeClient } from '../dist/index.js';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY, environment: 'development' });
const companyId = process.env.NFE_COMPANY_ID;

async function main() {
  if (!process.env.NFE_API_KEY || !companyId) {
    console.error('Defina NFE_API_KEY e NFE_COMPANY_ID.');
    process.exit(1);
  }

  try {
    console.log('\n🔔 Listar notificações');
    const { notifications = [] } = await nfe.notifications.list(companyId);
    console.log(`  ${notifications.length} notificação(ões)`);

    const first = notifications[0];
    if (first) {
      const detail = await nfe.notifications.retrieve(companyId, first.id);
      console.log('  primeira:', detail.id, '-', detail.type ?? detail.subject ?? '');
      // Remover: await nfe.notifications.delete(companyId, first.id);
    }

    // Enviar e-mail de notificação (payload conforme sua configuração):
    // await nfe.notifications.sendEmail(companyId, { to: 'destino@exemplo.com' });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
