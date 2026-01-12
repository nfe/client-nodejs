/**
 * Exemplo Real - Listar e Consultar Notas Fiscais
 *
 * Este exemplo demonstra:
 * - Listar empresas da conta
 * - Listar notas fiscais emitidas
 * - Consultar detalhes de uma nota específica
 * - Filtrar notas por período
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

console.log('📊 NFE.io SDK v3 - Consulta de Notas Fiscais');
console.log('═'.repeat(70));

async function consultarNotasFiscais() {
  try {
    // 1. Listar empresas
    console.log('\n📋 1. Buscando empresas...');
    const empresas = await nfe.companies.list();

    if (!empresas.data || empresas.data.length === 0) {
      console.error('❌ Nenhuma empresa encontrada');
      return;
    }

    console.log(`✅ ${empresas.data.length} empresa(s) encontrada(s):`);
    empresas.data.forEach((empresa, index) => {
      console.log(`   ${index + 1}. ${empresa.name} (${empresa.federalTaxNumber})`);
    });

    const empresa = empresas.data[0];
    console.log(`\n🏢 Usando empresa: ${empresa.name}`);

    // 2. Listar notas fiscais recentes
    console.log('\n📋 2. Listando notas fiscais recentes...');
    const resultado = await nfe.serviceInvoices.list(empresa.id, {
      page: 1,
      pageSize: 10
    });

    if (!resultado.data || resultado.data.length === 0) {
      console.log('⚠️  Nenhuma nota fiscal encontrada');
      console.log('💡 Execute o exemplo real-world-invoice.js para criar uma nota de teste');
      return;
    }

    console.log(`✅ ${resultado.data.length} nota(s) fiscal(is) encontrada(s):\n`);

    // 3. Exibir resumo das notas
    resultado.data.forEach((nota, index) => {
      console.log(`${index + 1}. Nota Fiscal #${nota.number || nota.id}`);
      console.log(`   Status: ${nota.status || 'issued'}`);
      console.log(`   Valor: R$ ${(nota.servicesAmount || 0).toFixed(2)}`);
      console.log(`   Tomador: ${nota.borrower?.name || 'N/A'}`);
      console.log(`   Emissão: ${nota.issuedOn || nota.createdAt || 'N/A'}`);
      console.log('   ' + '─'.repeat(60));
    });

    // 4. Consultar detalhes da primeira nota
    if (resultado.data.length > 0) {
      const primeiraNota = resultado.data[0];
      console.log('\n📋 3. Consultando detalhes da primeira nota...');

      const detalhes = await nfe.serviceInvoices.retrieve(empresa.id, primeiraNota.id);

      console.log('\n📄 Detalhes Completos:');
      console.log('═'.repeat(70));
      console.log(`Número: ${detalhes.number || 'N/A'}`);
      console.log(`ID: ${detalhes.id}`);
      console.log(`Status: ${detalhes.status || 'issued'}`);
      console.log(`Código de Verificação: ${detalhes.checkCode || 'N/A'}`);
      console.log(`\nPrestador:`);
      console.log(`  Nome: ${empresa.name}`);
      console.log(`  CNPJ: ${empresa.federalTaxNumber}`);
      console.log(`\nTomador:`);
      console.log(`  Nome: ${detalhes.borrower?.name || 'N/A'}`);
      console.log(`  CPF/CNPJ: ${detalhes.borrower?.federalTaxNumber || 'N/A'}`);
      console.log(`  Email: ${detalhes.borrower?.email || 'N/A'}`);
      console.log(`\nServiço:`);
      console.log(`  Código: ${detalhes.cityServiceCode || 'N/A'}`);
      console.log(`  Descrição: ${detalhes.description || 'N/A'}`);
      console.log(`\nValores:`);
      console.log(`  Serviços: R$ ${(detalhes.servicesAmount || 0).toFixed(2)}`);
      console.log(`  Deduções: R$ ${(detalhes.deductionsAmount || 0).toFixed(2)}`);
      console.log(`  Descontos: R$ ${(detalhes.discountAmount || 0).toFixed(2)}`);
      console.log(`  Total: R$ ${((detalhes.servicesAmount || 0) - (detalhes.deductionsAmount || 0) - (detalhes.discountAmount || 0)).toFixed(2)}`);
      console.log(`\nImpostos:`);
      console.log(`  ISS: R$ ${(detalhes.issAmount || 0).toFixed(2)} (${(detalhes.issRate || 0).toFixed(2)}%)`);
      console.log(`  IR: R$ ${(detalhes.irAmountWithheld || 0).toFixed(2)}`);
      console.log(`  PIS: R$ ${(detalhes.pisAmount || 0).toFixed(2)}`);
      console.log(`  COFINS: R$ ${(detalhes.cofinsAmount || 0).toFixed(2)}`);
      console.log(`  CSLL: R$ ${(detalhes.csllAmount || 0).toFixed(2)}`);
      console.log(`  INSS: R$ ${(detalhes.inssAmount || 0).toFixed(2)}`);

      if (detalhes.issuedOn) {
        console.log(`\nEmitida em: ${detalhes.issuedOn}`);
      }
    }

    // 5. Estatísticas rápidas
    console.log('\n📊 Estatísticas:');
    console.log('═'.repeat(70));
    const totalNotas = resultado.data.length;
    const valorTotal = resultado.data.reduce((sum, nota) => sum + (nota.servicesAmount || 0), 0);
    const valorMedio = valorTotal / totalNotas;

    console.log(`Total de notas listadas: ${totalNotas}`);
    console.log(`Valor total: R$ ${valorTotal.toFixed(2)}`);
    console.log(`Valor médio por nota: R$ ${valorMedio.toFixed(2)}`);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Consulta concluída com sucesso!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro durante a consulta:');
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

consultarNotasFiscais();
