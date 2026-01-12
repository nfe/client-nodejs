#!/usr/bin/env node

/**
 * Teste de Conexão e Configuração
 *
 * Este script testa se suas credenciais estão configuradas corretamente
 * e se a conexão com a API está funcionando.
 *
 * Execute: node examples/test-connection.js
 */

import { NfeClient } from '../dist/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do .env.test
config({ path: join(__dirname, '..', '.env.test') });

// Cores para output
const cores = {
  reset: '\x1b[0m',
  vermelho: '\x1b[31m',
  verde: '\x1b[32m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  ciano: '\x1b[36m'
};

function log(emoji, cor, mensagem) {
  console.log(`${emoji} ${cor}${mensagem}${cores.reset}`);
}

async function testarConexao() {
  console.log('\n' + '═'.repeat(70));
  log('🔍', cores.ciano, 'TESTE DE CONEXÃO - SDK NFE.io v3');
  console.log('═'.repeat(70) + '\n');

  // 1. Verificar variáveis de ambiente
  log('1️⃣', cores.azul, 'Verificando variáveis de ambiente...');

  const apiKey = process.env.NFE_API_KEY;
  if (!apiKey) {
    log('❌', cores.vermelho, 'ERRO: NFE_API_KEY não encontrada no .env.test');
    log('💡', cores.amarelo, 'Configure o arquivo .env.test com sua chave de API');
    process.exit(1);
  }

  log('✅', cores.verde, `API Key encontrada: ${apiKey.substring(0, 8)}...`);

  const environment = process.env.NFE_TEST_ENVIRONMENT || 'production';
  log('✅', cores.verde, `Environment: ${environment}`);
  console.log('');

  // 2. Inicializar cliente
  log('2️⃣', cores.azul, 'Inicializando cliente SDK...');

  let nfe;
  try {
    nfe = new NfeClient({
      apiKey: apiKey,
      environment: environment
    });
    log('✅', cores.verde, 'Cliente inicializado com sucesso');
  } catch (erro) {
    log('❌', cores.vermelho, `Erro ao inicializar cliente: ${erro.message}`);
    process.exit(1);
  }
  console.log('');

  // 3. Testar conexão com a API
  log('3️⃣', cores.azul, 'Testando conexão com a API...');

  try {
    const empresas = await nfe.companies.list();

    if (!empresas || !empresas.data) {
      log('❌', cores.vermelho, 'Resposta inválida da API');
      process.exit(1);
    }

    log('✅', cores.verde, `Conexão bem-sucedida! ${empresas.data.length} empresa(s) encontrada(s)`);

    if (empresas.data.length > 0) {
      console.log('');
      log('📊', cores.ciano, 'Empresas disponíveis:');
      empresas.data.forEach((empresa, index) => {
        console.log(`   ${index + 1}. ${cores.verde}${empresa.name || empresa.tradeName}${cores.reset}`);
        console.log(`      ID: ${empresa.id}`);
        console.log(`      CNPJ: ${empresa.federalTaxNumber || 'N/A'}`);
      });
    } else {
      log('⚠️', cores.amarelo, 'Nenhuma empresa cadastrada ainda');
      log('💡', cores.amarelo, 'Você precisa cadastrar uma empresa antes de emitir notas');
    }
  } catch (erro) {
    log('❌', cores.vermelho, `Erro ao conectar com a API: ${erro.message}`);

    if (erro.message.includes('401')) {
      log('💡', cores.amarelo, 'Verifique se sua API Key está correta');
    } else if (erro.message.includes('404')) {
      log('💡', cores.amarelo, 'Verifique se o endpoint da API está correto');
    } else if (erro.message.includes('ENOTFOUND') || erro.message.includes('timeout')) {
      log('💡', cores.amarelo, 'Verifique sua conexão com a internet');
    }

    process.exit(1);
  }
  console.log('');

  // 4. Verificar capacidades do SDK
  log('4️⃣', cores.azul, 'Verificando recursos do SDK...');

  const recursos = [
    { nome: 'Companies', disponivel: !!nfe.companies },
    { nome: 'Service Invoices', disponivel: !!nfe.serviceInvoices },
    { nome: 'Legal People', disponivel: !!nfe.legalPeople },
    { nome: 'Natural People', disponivel: !!nfe.naturalPeople },
    { nome: 'Webhooks', disponivel: !!nfe.webhooks }
  ];

  recursos.forEach(recurso => {
    const status = recurso.disponivel ? '✅' : '❌';
    const cor = recurso.disponivel ? cores.verde : cores.vermelho;
    log(status, cor, recurso.nome);
  });
  console.log('');

  // 5. Verificar build do projeto
  log('5️⃣', cores.azul, 'Verificando build do projeto...');

  try {
    const fs = await import('fs');
    const distPath = join(__dirname, '..', 'dist', 'index.js');

    if (fs.existsSync(distPath)) {
      log('✅', cores.verde, 'Build do projeto encontrado em dist/');
    } else {
      log('⚠️', cores.amarelo, 'Build não encontrado - execute: npm run build');
    }
  } catch (erro) {
    log('⚠️', cores.amarelo, `Não foi possível verificar build: ${erro.message}`);
  }
  console.log('');

  // Resumo final
  console.log('═'.repeat(70));
  log('🎉', cores.verde, 'TESTE CONCLUÍDO COM SUCESSO!');
  console.log('═'.repeat(70));
  console.log('');
  log('✨', cores.ciano, 'Próximos passos:');
  console.log(`   ${cores.verde}1.${cores.reset} Execute os exemplos: ${cores.ciano}npm run examples${cores.reset}`);
  console.log(`   ${cores.verde}2.${cores.reset} Comece com: ${cores.ciano}node examples/real-world-list-invoices.js${cores.reset}`);
  console.log(`   ${cores.verde}3.${cores.reset} Veja a documentação: ${cores.ciano}examples/README.md${cores.reset}`);
  console.log('');
}

// Executar teste
testarConexao().catch((erro) => {
  console.error('\n❌ Erro fatal:', erro);
  process.exit(1);
});
