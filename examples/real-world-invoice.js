/**
 * Exemplo Real - Emissão de Nota Fiscal de Serviço
 *
 * Este exemplo usa credenciais reais do .env.test e demonstra:
 * - Buscar empresa configurada
 * - Criar/buscar tomador (pessoa jurídica)
 * - Emitir nota fiscal com polling automático
 * - Enviar nota por email
 * - Baixar PDF da nota
 */

import { NfeClient } from '../dist/index.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Carregar credenciais do .env.test
dotenv.config({ path: '.env.test' });

const apiKey = process.env.NFE_API_KEY;
const environment = process.env.NFE_TEST_ENVIRONMENT || 'development';

if (!apiKey) {
  console.error('❌ NFE_API_KEY não encontrada no .env.test');
  process.exit(1);
}

// Inicializar cliente
const nfe = new NfeClient({
  apiKey,
  environment,
  timeout: 60000 // 60 segundos para operações mais longas
});

console.log('🚀 NFE.io SDK v3 - Exemplo de Emissão de Nota Fiscal');
console.log('═'.repeat(70));
console.log(`Environment: ${environment}`);
console.log('═'.repeat(70));

async function emitirNotaFiscal() {
  try {
    // 1. Listar empresas disponíveis
    console.log('\n📋 1. Buscando empresas disponíveis...');
    const empresas = await nfe.companies.list();

    if (!empresas.data || empresas.data.length === 0) {
      console.error('❌ Nenhuma empresa encontrada na conta');
      return;
    }

    const empresa = empresas.data[0];
    console.log(`✅ Empresa encontrada: ${empresa.name} (${empresa.id})`);
    console.log(`   CNPJ: ${empresa.federalTaxNumber}`);

    // 2. Buscar ou criar tomador (pessoa jurídica)
    console.log('\n📋 2. Verificando tomador dos serviços...');

    let tomador;
    const cnpjTomador = '00000000000191'; // Banco do Brasil (exemplo)

    try {
      // Tentar buscar tomador existente
      tomador = await nfe.legalPeople.findByTaxNumber(empresa.id, cnpjTomador);
      console.log(`✅ Tomador encontrado: ${tomador.name}`);
    } catch (error) {
      if (error.statusCode === 404) {
        // Criar novo tomador se não existir
        console.log('⚠️  Tomador não encontrado, criando novo...');
        tomador = await nfe.legalPeople.create(empresa.id, {
          federalTaxNumber: cnpjTomador,
          name: 'BANCO DO BRASIL SA',
          email: 'exemplo@bb.com.br',
          address: {
            country: 'BRA',
            postalCode: '70073901',
            street: 'Outros Quadra 1 Bloco G Lote 32',
            number: 'S/N',
            additionalInformation: 'QUADRA 01 BLOCO G',
            district: 'Asa Sul',
            city: {
              code: '5300108',
              name: 'Brasília'
            },
            state: 'DF'
          }
        });
        console.log(`✅ Tomador criado: ${tomador.name}`);
      } else {
        throw error;
      }
    }

    // 3. Emitir nota fiscal com polling automático
    console.log('\n📋 3. Emitindo nota fiscal de serviço...');
    console.log('⏳ Aguarde, processamento assíncrono em andamento...');

    const dadosNota = {
      // Código do serviço (exemplo: consultoria em TI)
      cityServiceCode: '2690',

      // Descrição detalhada dos serviços
      description: 'Consultoria em Tecnologia da Informação - Desenvolvimento de Software',

      // Valor dos serviços (R$ 1.500,00)
      servicesAmount: 1500.00,

      // Dados do tomador
      borrower: {
        federalTaxNumber: parseInt(tomador.federalTaxNumber),
        name: tomador.name,
        email: tomador.email,
        address: tomador.address
      }
    };

    // Usar createAndWait para aguardar conclusão automaticamente
    const notaFiscal = await nfe.serviceInvoices.createAndWait(
      empresa.id,
      dadosNota,
      {
        maxAttempts: 30,
        intervalMs: 2000 // 2 segundos entre tentativas
      }
    );

    console.log('✅ Nota fiscal emitida com sucesso!');
    console.log(`   Número: ${notaFiscal.number || 'N/A'}`);
    console.log(`   ID: ${notaFiscal.id}`);
    console.log(`   Status: ${notaFiscal.status || 'issued'}`);
    console.log(`   Valor: R$ ${notaFiscal.servicesAmount?.toFixed(2) || dadosNota.servicesAmount.toFixed(2)}`);

    // 4. Enviar nota por email
    console.log('\n📋 4. Enviando nota fiscal por email...');
    try {
      await nfe.serviceInvoices.sendEmail(empresa.id, notaFiscal.id);
      console.log(`✅ Email enviado para: ${tomador.email}`);
    } catch (error) {
      console.warn(`⚠️  Não foi possível enviar email: ${error.message}`);
    }

    // 5. Baixar PDF da nota fiscal
    console.log('\n📋 5. Baixando PDF da nota fiscal...');
    try {
      const pdfBuffer = await nfe.serviceInvoices.downloadPdf(empresa.id, notaFiscal.id);
      const nomeArquivo = `nota-fiscal-${notaFiscal.number || notaFiscal.id}.pdf`;
      writeFileSync(nomeArquivo, pdfBuffer);
      console.log(`✅ PDF salvo: ${nomeArquivo} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.warn(`⚠️  Não foi possível baixar PDF: ${error.message}`);
    }

    // 6. Baixar XML da nota fiscal
    console.log('\n📋 6. Baixando XML da nota fiscal...');
    try {
      const xmlData = await nfe.serviceInvoices.downloadXml(empresa.id, notaFiscal.id);
      const nomeArquivoXml = `nota-fiscal-${notaFiscal.number || notaFiscal.id}.xml`;
      writeFileSync(nomeArquivoXml, xmlData);
      console.log(`✅ XML salvo: ${nomeArquivoXml}`);
    } catch (error) {
      console.warn(`⚠️  Não foi possível baixar XML: ${error.message}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 Processo concluído com sucesso!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro durante o processo:');
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

// Executar exemplo
emitirNotaFiscal();
