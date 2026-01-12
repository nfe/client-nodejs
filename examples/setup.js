#!/usr/bin/env node

/**
 * Script de Setup Inicial
 *
 * Este script ajuda a configurar o ambiente para executar os exemplos.
 *
 * Execute: node examples/setup.js
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Cores
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${c.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${c.cyan}${prompt}${c.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setup() {
  console.log('\n' + '═'.repeat(70));
  log('🚀', c.bold + c.cyan, 'SETUP - NFE.io SDK v3 - Configuração de Exemplos');
  console.log('═'.repeat(70) + '\n');

  // Passo 1: Verificar se já existe .env.test
  const envTestPath = join(projectRoot, '.env.test');
  const envTestExists = existsSync(envTestPath);

  if (envTestExists) {
    log('✅', c.green, '.env.test já existe');
    console.log('');
    const resposta = await question('Deseja reconfigurá-lo? (s/N): ');

    if (resposta.toLowerCase() !== 's') {
      log('👍', c.blue, 'Mantendo configuração existente');
      console.log('');
      await verificarBuild();
      rl.close();
      return;
    }
  }

  // Passo 2: Coletar informações
  console.log('');
  log('📝', c.blue, 'Vamos configurar seu ambiente de desenvolvimento');
  console.log('');
  console.log('Você precisará de:');
  console.log(`  ${c.yellow}1.${c.reset} Sua chave de API (API Key) da NFE.io`);
  console.log(`  ${c.yellow}2.${c.reset} ID de uma empresa cadastrada (opcional)`);
  console.log('');
  console.log(`${c.cyan}💡 Dica: Acesse https://account.nfe.io/ para obter sua chave${c.reset}`);
  console.log('');

  const apiKey = await question('API Key: ');

  if (!apiKey) {
    log('❌', c.red, 'API Key é obrigatória!');
    rl.close();
    process.exit(1);
  }

  console.log('');
  const environment = await question('Environment (production/development) [production]: ');
  const env = environment || 'production';

  console.log('');
  const companyId = await question('Company ID (opcional, deixe vazio para pular): ');

  // Passo 3: Criar .env.test
  console.log('');
  log('💾', c.blue, 'Salvando configuração...');

  const envContent = `# NFE.io SDK v3 - Configuração de Teste
# Gerado automaticamente em ${new Date().toISOString()}

# Chave de API da NFE.io (OBRIGATÓRIO)
NFE_API_KEY=${apiKey}

# Environment: production ou development
NFE_TEST_ENVIRONMENT=${env}

# ID da empresa (opcional - usado nos exemplos)
${companyId ? `NFE_COMPANY_ID=${companyId}` : '# NFE_COMPANY_ID=seu-company-id-aqui'}

# Timeout em ms (opcional)
# NFE_TIMEOUT=30000
`;

  try {
    writeFileSync(envTestPath, envContent, 'utf-8');
    log('✅', c.green, '.env.test criado com sucesso!');
  } catch (erro) {
    log('❌', c.red, `Erro ao criar .env.test: ${erro.message}`);
    rl.close();
    process.exit(1);
  }

  // Passo 4: Verificar build
  console.log('');
  await verificarBuild();

  // Passo 5: Próximos passos
  console.log('');
  console.log('═'.repeat(70));
  log('🎉', c.green, 'SETUP CONCLUÍDO COM SUCESSO!');
  console.log('═'.repeat(70));
  console.log('');
  log('✨', c.cyan, 'Próximos passos:');
  console.log('');
  console.log(`   ${c.green}1.${c.reset} Teste a conexão:`);
  console.log(`      ${c.cyan}node examples/test-connection.js${c.reset}`);
  console.log('');
  console.log(`   ${c.green}2.${c.reset} Execute os exemplos:`);
  console.log(`      ${c.cyan}npm run examples${c.reset}`);
  console.log('');
  console.log(`   ${c.green}3.${c.reset} Leia a documentação:`);
  console.log(`      ${c.cyan}examples/README.md${c.reset}`);
  console.log('');

  rl.close();
}

async function verificarBuild() {
  log('🔍', c.blue, 'Verificando build do projeto...');

  const distPath = join(projectRoot, 'dist', 'index.js');

  if (existsSync(distPath)) {
    log('✅', c.green, 'Build encontrado em dist/');
    return true;
  } else {
    log('⚠️', c.yellow, 'Build não encontrado!');
    console.log('');
    console.log(`   Execute: ${c.cyan}npm run build${c.reset}`);
    console.log('');

    const resposta = await question('Deseja fazer o build agora? (S/n): ');

    if (resposta.toLowerCase() !== 'n') {
      log('⏳', c.blue, 'Executando build...');
      console.log('');

      const { spawn } = await import('child_process');

      return new Promise((resolve) => {
        const buildProcess = spawn('npm', ['run', 'build'], {
          cwd: projectRoot,
          stdio: 'inherit',
          shell: true
        });

        buildProcess.on('close', (code) => {
          console.log('');
          if (code === 0) {
            log('✅', c.green, 'Build concluído com sucesso!');
            resolve(true);
          } else {
            log('❌', c.red, `Build falhou com código ${code}`);
            resolve(false);
          }
        });

        buildProcess.on('error', (erro) => {
          console.log('');
          log('❌', c.red, `Erro ao executar build: ${erro.message}`);
          resolve(false);
        });
      });
    }

    return false;
  }
}

// Executar setup
setup().catch((erro) => {
  console.error('\n❌ Erro fatal:', erro);
  rl.close();
  process.exit(1);
});
