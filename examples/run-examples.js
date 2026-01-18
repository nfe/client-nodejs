#!/usr/bin/env node

/**
 * Script Helper - Executar Exemplos Reais
 *
 * Este script facilita a execução dos exemplos práticos do SDK.
 * Use: node examples/run-examples.js [numero-do-exemplo]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exemplos = [
  {
    nome: '🔍 Testar Conexão e Configuração',
    arquivo: 'test-connection.js',
    descricao: 'Verifica se as credenciais estão corretas e a API está acessível',
    recomendado: '👈 COMECE AQUI!'
  },
  {
    nome: 'Listar Notas Fiscais',
    arquivo: 'real-world-list-invoices.js',
    descricao: 'Lista notas fiscais existentes e mostra detalhes',
    recomendado: 'Não cria nada, apenas consulta'
  },
  {
    nome: 'Gerenciar Pessoas (Clientes)',
    arquivo: 'real-world-manage-people.js',
    descricao: 'Cria e gerencia pessoas jurídicas e físicas',
    recomendado: 'Execute antes de emitir notas'
  },
  {
    nome: 'Emitir Nota Fiscal Completa',
    arquivo: 'real-world-invoice.js',
    descricao: 'Emite nota fiscal, envia email e baixa PDF/XML',
    recomendado: 'Exemplo completo ⭐'
  },
  {
    nome: 'Configurar Webhooks',
    arquivo: 'real-world-webhooks.js',
    descricao: 'Demonstra configuração de webhooks (não cria real)',
    recomendado: 'Avançado'
  }
];

function exibirMenu() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 NFE.io SDK v3 - Exemplos Práticos                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('Exemplos disponíveis:\n');

  exemplos.forEach((exemplo, index) => {
    console.log(`  ${index + 1}. ${exemplo.nome}`);
    console.log(`     📝 ${exemplo.descricao}`);
    if (exemplo.recomendado) {
      console.log(`     💡 ${exemplo.recomendado}`);
    }
    console.log('');
  });

  console.log('  0. Sair\n');
  console.log('─'.repeat(70));
  console.log('💡 Dica: Comece pelo teste de conexão (opção 1)');
  console.log('💡 Execute `npm run build` antes de rodar os exemplos');
  console.log('💡 Configure .env.test com suas credenciais');
  console.log('─'.repeat(70));
}

function executarExemplo(index) {
  const exemplo = exemplos[index];
  if (!exemplo) {
    console.error('❌ Exemplo inválido');
    return Promise.resolve(false);
  }

  const caminhoArquivo = join(__dirname, exemplo.arquivo);

  console.log('\n' + '═'.repeat(70));
  console.log(`🚀 Executando: ${exemplo.nome}`);
  console.log('═'.repeat(70));
  console.log(`📁 Arquivo: ${exemplo.arquivo}`);
  console.log(`📝 ${exemplo.descricao}\n`);
  console.log('─'.repeat(70));
  console.log('');

  return new Promise((resolve) => {
    const child = spawn('node', [caminhoArquivo], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n' + '═'.repeat(70));
        console.log('✅ Exemplo executado com sucesso!');
        console.log('═'.repeat(70));
        resolve(true);
      } else {
        console.log('\n' + '═'.repeat(70));
        console.log(`❌ Exemplo terminou com código de erro: ${code}`);
        console.log('═'.repeat(70));
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error('\n' + '═'.repeat(70));
      console.error(`❌ Erro ao executar exemplo: ${err.message}`);
      console.error('═'.repeat(70));
      resolve(false);
    });
  });
}

async function executarTodos() {
  console.log('\n🚀 Executando TODOS os exemplos em sequência...\n');

  for (let i = 0; i < exemplos.length; i++) {
    const sucesso = await executarExemplo(i);

    if (!sucesso) {
      console.log('\n⚠️  Parando execução devido a erro');
      break;
    }

    if (i < exemplos.length - 1) {
      console.log('\n⏸️  Aguardando 3 segundos antes do próximo exemplo...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n✅ Todos os exemplos foram executados!');
}

async function modoInterativo() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function perguntarOpcao() {
    return new Promise((resolve) => {
      rl.question('\nEscolha um exemplo (0-5) ou "all" para executar todos: ', (resposta) => {
        resolve(resposta.trim());
      });
    });
  }

  while (true) {
    exibirMenu();
    const opcao = await perguntarOpcao();

    if (opcao === '0' || opcao.toLowerCase() === 'sair') {
      console.log('\n👋 Até logo!\n');
      rl.close();
      break;
    }

    if (opcao.toLowerCase() === 'all' || opcao.toLowerCase() === 'todos') {
      await executarTodos();
      console.log('\n');
      continue;
    }

    const index = parseInt(opcao) - 1;
    if (index >= 0 && index < exemplos.length) {
      await executarExemplo(index);
    } else {
      console.error('\n❌ Opção inválida! Escolha um número entre 1 e 5.\n');
    }
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  // Modo interativo
  modoInterativo().catch(console.error);
} else if (args[0] === 'all' || args[0] === 'todos') {
  // Executar todos
  executarTodos().catch(console.error);
} else {
  // Executar exemplo específico
  const index = parseInt(args[0]) - 1;
  if (index >= 0 && index < exemplos.length) {
    executarExemplo(index).then(() => process.exit(0));
  } else {
    console.error('❌ Número de exemplo inválido');
    console.log('\nUso:');
    console.log('  node examples/run-examples.js          # Modo interativo');
    console.log('  node examples/run-examples.js [1-5]    # Executar exemplo específico');
    console.log('  node examples/run-examples.js all      # Executar todos');
    process.exit(1);
  }
}
