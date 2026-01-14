/**
 * Exemplo Real - Gerenciamento de Pessoas Jurídicas e Físicas
 *
 * Este exemplo demonstra:
 * - Criar pessoa jurídica (empresa)
 * - Criar pessoa física (indivíduo)
 * - Listar pessoas cadastradas
 * - Buscar por CPF/CNPJ
 * - Atualizar dados cadastrais
 */

import { NfeClient } from '../dist/index.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const apiKey = process.env.NFE_API_KEY;
const companyId = process.env.NFE_COMPANY_ID; // Use company from env
const environment = process.env.NFE_TEST_ENVIRONMENT || 'development';

if (!apiKey) {
  console.error('❌ NFE_API_KEY não encontrada no .env.test');
  process.exit(1);
}

if (!companyId) {
  console.error('❌ NFE_COMPANY_ID não encontrada no .env.test');
  console.error('💡 Configure NFE_COMPANY_ID no arquivo .env.test');
  process.exit(1);
}

const nfe = new NfeClient({ apiKey, environment });

console.log('👥 NFE.io SDK v3 - Gerenciamento de Pessoas');
console.log('═'.repeat(70));

async function gerenciarPessoas() {
  try {
    // 1. Buscar empresa
    console.log('\n📋 1. Buscando empresa...');
    const empresa = await nfe.companies.retrieve(companyId);
    console.log(`✅ Empresa: ${empresa.name}`);

    // 2. Criar/Buscar Pessoa Jurídica
    console.log('\n📋 2. Gerenciando Pessoa Jurídica (Empresa Cliente)...');

    const cnpjExemplo = 33571681386979; // CNPJ válido com dígitos verificadores
    let pessoaJuridica;

    // findByTaxNumber returns undefined if not found (doesn't throw)
    pessoaJuridica = await nfe.legalPeople.findByTaxNumber(empresa.id, cnpjExemplo);

    if (pessoaJuridica) {
      console.log(`✅ Pessoa jurídica encontrada: ${pessoaJuridica.name}`);
    } else {
      console.log('⚠️  Pessoa jurídica não encontrada, criando...');

      pessoaJuridica = await nfe.legalPeople.create(empresa.id, {
        federalTaxNumber: cnpjExemplo,
          name: 'Tech Solutions Ltda',
          email: 'contato@techsolutions.com.br',
          address: {
            country: 'BRA',
            postalCode: '01310-100',
            street: 'Avenida Paulista',
            number: '1578',
            additionalInformation: 'Conjunto 101',
            district: 'Bela Vista',
            city: {
              code: '3550308',
              name: 'São Paulo'
            },
            state: 'SP'
          }
        });

        console.log(`✅ Pessoa jurídica criada: ${pessoaJuridica.name}`);
        console.log(`   ID: ${pessoaJuridica.id}`);
        console.log(`   CNPJ: ${pessoaJuridica.federalTaxNumber}`);
        console.log(`   Email: ${pessoaJuridica.email}`);
    }

    // 3. Criar/Buscar Pessoa Física
    console.log('\n📋 3. Gerenciando Pessoa Física (Cliente Individual)...');

    const cpfExemplo = 12345678909; // CPF válido com dígitos verificadores
    let pessoaFisica;

    // findByTaxNumber returns undefined if not found (doesn't throw)
    pessoaFisica = await nfe.naturalPeople.findByTaxNumber(empresa.id, cpfExemplo);

    if (pessoaFisica) {
      console.log(`✅ Pessoa física encontrada: ${pessoaFisica.name}`);
    } else {
      console.log('⚠️  Pessoa física não encontrada, criando...');

        pessoaFisica = await nfe.naturalPeople.create(empresa.id, {
          federalTaxNumber: cpfExemplo,
          name: 'João da Silva Santos',
          email: 'joao.silva@email.com.br',
          address: {
            country: 'BRA',
            postalCode: '22250-040',
            street: 'Rua Voluntários da Pátria',
            number: '445',
            additionalInformation: 'Apto 302',
            district: 'Botafogo',
            city: {
              code: '3304557',
              name: 'Rio de Janeiro'
            },
            state: 'RJ'
          }
        });

        console.log(`✅ Pessoa física criada: ${pessoaFisica.name}`);
        console.log(`   ID: ${pessoaFisica.id}`);
        console.log(`   CPF: ${pessoaFisica.federalTaxNumber}`);
        console.log(`   Email: ${pessoaFisica.email}`);
    }

    // 4. Listar todas as pessoas jurídicas
    console.log('\n📋 4. Listando pessoas jurídicas cadastradas...');
    const listaPJ = await nfe.legalPeople.list(empresa.id);

    console.log(`✅ ${listaPJ.data?.length || 0} pessoa(s) jurídica(s) encontrada(s):`);
    listaPJ.data?.slice(0, 5).forEach((pj, index) => {
      console.log(`   ${index + 1}. ${pj.name} - CNPJ: ${pj.federalTaxNumber}`);
    });

    if (listaPJ.data?.length > 5) {
      console.log(`   ... e mais ${listaPJ.data.length - 5} pessoa(s)`);
    }

    // 5. Listar todas as pessoas físicas
    console.log('\n📋 5. Listando pessoas físicas cadastradas...');
    const listaPF = await nfe.naturalPeople.list(empresa.id);

    console.log(`✅ ${listaPF.data?.length || 0} pessoa(s) física(s) encontrada(s):`);
    listaPF.data?.slice(0, 5).forEach((pf, index) => {
      console.log(`   ${index + 1}. ${pf.name} - CPF: ${pf.federalTaxNumber}`);
    });

    if (listaPF.data?.length > 5) {
      console.log(`   ... e mais ${listaPF.data.length - 5} pessoa(s)`);
    }

    // 6. Atualizar dados de uma pessoa jurídica
    console.log('\n📋 6. Atualizando dados da pessoa jurídica...');
    try {
      const pessoaAtualizada = await nfe.legalPeople.update(empresa.id, pessoaJuridica.id, {
        email: 'novo-contato@techsolutions.com.br',
        address: {
          ...pessoaJuridica.address,
          additionalInformation: 'Conjunto 101 - Sala A'
        }
      });

      console.log(`✅ Dados atualizados para: ${pessoaAtualizada.name}`);
      console.log(`   Novo email: ${pessoaAtualizada.email}`);
    } catch (error) {
      console.warn(`⚠️  Não foi possível atualizar: ${error.message}`);
    }

    // 7. Demonstrar busca por CPF/CNPJ
    console.log('\n📋 7. Testando busca por CPF/CNPJ...');

    try {
      const busca1 = await nfe.legalPeople.findByTaxNumber(empresa.id, cnpjExemplo);
      console.log(`✅ Busca por CNPJ: ${busca1.name}`);
    } catch (error) {
      console.warn(`⚠️  CNPJ não encontrado`);
    }

    try {
      const busca2 = await nfe.naturalPeople.findByTaxNumber(empresa.id, cpfExemplo);
      console.log(`✅ Busca por CPF: ${busca2.name}`);
    } catch (error) {
      console.warn(`⚠️  CPF não encontrado`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Gerenciamento de pessoas concluído com sucesso!');
    console.log('═'.repeat(70));
    console.log('\n💡 Dica: Use essas pessoas cadastradas ao emitir notas fiscais');
    console.log('   para evitar redigitar os dados a cada emissão.');

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

gerenciarPessoas();
