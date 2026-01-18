# 📁 Configuração de Arquivos - NFE.io SDK v3

Este documento descreve a configuração de arquivos de controle do projeto para o SDK v3.

## � Estrutura de Diretórios

```
client-nodejs/
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
│       ├── ci.yml        # Testes e validação
│       └── publish.yml   # Publicação no NPM
├── dist/                 # ⚠️ Gerado pelo build (não versionado)
│   ├── index.js          # ESM bundle
│   ├── index.cjs         # CommonJS bundle
│   ├── index.d.ts        # TypeScript definitions (ESM)
│   ├── index.d.cts       # TypeScript definitions (CJS)
│   └── *.map             # Source maps
├── src/                  # Código-fonte TypeScript
│   ├── core/             # Core do SDK
│   │   ├── client.ts     # NfeClient principal
│   │   ├── types.ts      # Tipos TypeScript
│   │   ├── errors/       # Sistema de erros
│   │   ├── http/         # HTTP client layer
│   │   ├── resources/    # API Resources (Companies, ServiceInvoices, etc)
│   │   └── utils/        # Utilitários (validações, certificados)
│   ├── generated/        # ⚠️ Auto-gerado do OpenAPI (não editar)
│   │   ├── nf-servico-v1.ts
│   │   └── *.ts          # Tipos de outras APIs
│   └── index.ts          # Exports públicos
├── tests/
│   ├── unit/             # Testes unitários
│   ├── integration/      # Testes de integração
│   └── setup.ts          # Setup dos testes
├── openapi/
│   ├── spec/             # Especificações OpenAPI
│   └── generator-config.yaml
├── scripts/              # Scripts de desenvolvimento
│   ├── generate-types.ts # Geração de tipos do OpenAPI
│   ├── validate-spec.ts  # Validação das specs
│   └── download-openapi.ts
├── examples/             # Exemplos de uso
├── docs/                 # Documentação técnica
├── coverage/             # ⚠️ Gerado pelos testes (não versionado)
└── logs/                 # ⚠️ Logs do projeto (não versionado)
```

## �📋 Arquivos de Configuração

### `.gitignore`
**Propósito**: Define quais arquivos/diretórios o Git deve ignorar.

**Principais exclusões**:
- ✅ `node_modules/` - Dependências (instaladas via npm)
- ✅ `dist/` - Código compilado (gerado pelo build)
- ✅ `coverage/` - Relatórios de cobertura de testes
- ✅ `*.tgz` - Pacotes NPM gerados
- ✅ `.env*` - Variáveis de ambiente
- ✅ `logs/` - Arquivos de log do projeto
- ✅ `*.log` - Arquivos de log (npm-debug.log, yarn-error.log, etc)
- ✅ IDE configs - `.vscode/`, `.idea/`, `*.iml`
- ✅ OS files - `.DS_Store`, `Thumbs.db`, `ehthumbs.db`
- ✅ Build artifacts - `*.tsbuildinfo`, `buildAssets/`
- ✅ Coverage - `.nyc_output/`, `*.lcov`

**O que é versionado**:
- ✅ `src/` - Código-fonte TypeScript
- ✅ `tests/` - Testes unitários e de integração
- ✅ `openapi/` - Especificações OpenAPI e gerador
- ✅ `scripts/` - Scripts de build e validação
- ✅ Arquivos de configuração (`.eslintrc.cjs`, `tsconfig.json`, `tsup.config.ts`, etc)
- ✅ Documentação (`README.md`, `CHANGELOG.md`, `MIGRATION.md`, etc)
- ✅ GitHub Actions (`.github/workflows/`)
- ✅ Examples (`examples/`) - Exemplos de uso do SDK

### `.npmignore`
**Propósito**: Define o que **não** será publicado no NPM.

**Excluído do pacote NPM**:
- ❌ `src/` - Código-fonte TypeScript (publicamos apenas `dist/`)
- ❌ `tests/` - Testes unitários e de integração
- ❌ `examples/` - Exemplos de código
- ❌ `scripts/` - Scripts de desenvolvimento
- ❌ `openapi/` - Especificações OpenAPI e configuração do gerador
- ❌ `docs/` - Documentação interna do projeto
- ❌ Configs de desenvolvimento (`.eslintrc.cjs`, `tsconfig.json`, `vitest.config.ts`, etc)
- ❌ Documentação interna (`AGENTS.md`, `CONTRIBUTING.md`, `FILE_CONFIGURATION.md`, etc)
- ❌ CI/CD configs (`.github/`, workflows)
- ❌ Arquivos legados (`lib/`, `samples/`, `VERSION`)
- ❌ Logs e temporários (`logs/`, `*.log`, `.env*`)

**Incluído no pacote NPM** (via `package.json` "files"):
- ✅ `dist/` - Código compilado (ESM + CommonJS + Types)
- ✅ `README.md` - Documentação principal
- ✅ `CHANGELOG.md` - Histórico de versões
- ✅ `MIGRATION.md` - Guia de migração v2→v3
- ✅ `package.json` - Metadados do pacote
- ✅ `LICENSE` (se presente)

### `.gitattributes`
**Propósito**: Controla como o Git trata diferentes tipos de arquivo.

**Configurações**:
- ✅ **Line endings**: LF para código (`*.ts`, `*.js`, `*.json`)
- ✅ **PowerShell**: CRLF para `*.ps1` (Windows)
- ✅ **Diff patterns**: TypeScript, JavaScript, JSON, Markdown
- ✅ **Binary files**: Imagens, fontes, arquivos compactados
- ✅ **Export-ignore**: Arquivos de dev não incluídos em archives
- ✅ **Merge strategies**: `package-lock.json` usa merge=ours

### `.editorconfig`
**Propósito**: Mantém estilo de código consistente entre editores.

**Configurações**:
- ✅ **Charset**: UTF-8
- ✅ **Indentação**: 2 espaços (TypeScript, JavaScript, JSON)
- ✅ **Line endings**: LF (exceto PowerShell = CRLF)
- ✅ **Trim trailing whitespace**: Sim
- ✅ **Insert final newline**: Sim
- ✅ **Max line length**: 100 (TypeScript/JavaScript)

### `package.json` - Campo "files"
**Propósito**: Lista explícita de arquivos/diretórios publicados no NPM.

```json
{
  "files": [
    "dist",           // Código compilado
    "README.md",      // Documentação
    "CHANGELOG.md",   // Release notes
    "MIGRATION.md"    // Guia v2→v3
  ]
}
```

### `tsconfig.json`
**Propósito**: Configuração do compilador TypeScript.

**Principais configurações**:
- ✅ **Target**: ES2020 (Node.js 18+)
- ✅ **Module**: ESNext (com moduleResolution: bundler)
- ✅ **Strict mode**: Habilitado (máxima segurança de tipos)
- ✅ **Declarations**: Gera arquivos `.d.ts` automaticamente
- ✅ **Source maps**: Habilitado para debugging
- ✅ **RootDir**: `./src` (entrada)
- ✅ **OutDir**: `./dist` (saída - apenas para typecheck, build real usa tsup)

### `tsup.config.ts`
**Propósito**: Configuração do bundler de produção.

**Principais configurações**:
- ✅ **Entry**: `src/index.ts`
- ✅ **Formats**: `['cjs', 'esm']` (dual package)
- ✅ **DTS**: `true` (gera `.d.ts` e `.d.cts`)
- ✅ **Sourcemap**: `true` (inclui `.map` files)
- ✅ **Minify**: `true` (código otimizado)
- ✅ **Treeshake**: `true` (remove código não usado)
- ✅ **Clean**: `true` (limpa dist/ antes do build)
- ✅ **Target**: `node18` (compatibilidade)

### `vitest.config.ts`
**Propósito**: Configuração do framework de testes.

**Principais configurações**:
- ✅ **Coverage**: v8 provider com threshold de 80%
- ✅ **Globals**: `false` (imports explícitos)
- ✅ **Environment**: `node`
- ✅ **Include**: `tests/**/*.test.ts`
- ✅ **Exclude**: `node_modules/`, `dist/`, `coverage/`
- ✅ **Timeout**: 10000ms para testes de integração

### `.eslintrc.cjs`
**Propósito**: Regras de linting e formatação de código.

**Principais configurações**:
- ✅ **Parser**: `@typescript-eslint/parser`
- ✅ **Extends**: TypeScript recommended + Prettier
- ✅ **Rules**: Personalizadas para o projeto
- ✅ **Env**: Node.js + ES2020

## 📊 Tamanho do Pacote NPM

```
Arquivo                  Tamanho
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dist/index.js            85.8 KB  (ESM)
dist/index.cjs           87.6 KB  (CommonJS)
dist/index.d.ts          56.3 KB  (TypeScript types ESM)
dist/index.d.cts         56.3 KB  (TypeScript types CJS)
dist/*.map              328.0 KB  (Source maps)
README.md                15.6 KB
CHANGELOG.md              5.2 KB
MIGRATION.md             17.7 KB
package.json              2.7 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total (tarball)         134.2 KB
Total (unpacked)        670.7 KB
Total files                   10
```

## ✅ Validação

### Verificar o que será publicado no NPM
```bash
npm pack --dry-run
```

**Saída esperada**:
```
npm notice 📦  nfe-io@3.0.0
npm notice Tarball Contents
npm notice 5.2kB  CHANGELOG.md
npm notice 17.7kB MIGRATION.md
npm notice 15.6kB README.md
npm notice 87.6kB dist/index.cjs
npm notice 164.3kB dist/index.cjs.map
npm notice 56.3kB dist/index.d.cts
npm notice 56.3kB dist/index.d.ts
npm notice 85.8kB dist/index.js
npm notice 163.7kB dist/index.js.map
npm notice 2.7kB  package.json
npm notice Tarball Details
npm notice name:          nfe-io
npm notice version:       3.0.0
npm notice package size:  134.2 kB
npm notice unpacked size: 670.7 kB
npm notice total files:   10
```

### Testar instalação local
```bash
# 1. Criar tarball
npm pack

# 2. Instalar em projeto teste
cd ../test-project
npm install ../client-nodejs/nfe-io-3.0.0.tgz

# 3. Verificar imports ESM
node --input-type=module --eval "import { NfeClient } from 'nfe-io'; console.log('✅ ESM OK');"

# 4. Verificar imports CommonJS
node --input-type=commonjs --eval "const { NfeClient } = require('nfe-io'); console.log('✅ CJS OK');"

# 5. Verificar tipos TypeScript
echo "import { NfeClient } from 'nfe-io';" > test.ts
npx tsc --noEmit test.ts && echo "✅ Types OK"
```

### Verificar arquivos ignorados pelo Git
```bash
git status --ignored
```

## 🎯 Comparação v2 vs v3

| Aspecto | v2 (Legado) | v3 (Atual) |
|---------|-------------|------------|
| **Código publicado** | `lib/*.js` | `dist/*.{js,cjs,d.ts,d.cts}` |
| **Line endings** | Inconsistente | LF (via .gitattributes) |
| **Indentação** | Mista | 2 espaços (via .editorconfig) |
| **Docs incluídas** | README | README + CHANGELOG + MIGRATION |
| **Source maps** | ❌ Não | ✅ Sim (.map files) |
| **TypeScript types** | ❌ Não | ✅ Sim (.d.ts + .d.cts) |
| **Dual package** | ❌ Não | ✅ ESM + CommonJS |
| **OpenAPI types** | ❌ Não | ✅ Sim (7 specs gerados) |
| **Tamanho tarball** | ~50 KB | 134.2 KB (+docs +types +source maps) |
| **Total files** | ~5 | 10 |

## 🔍 Troubleshooting

### Arquivo não ignorado pelo Git
```bash
# Remover arquivo do cache do Git
git rm --cached path/to/file

# Re-adicionar respeitando .gitignore
git add .
```

### Arquivo indesejado no pacote NPM
1. Verificar `.npmignore`
2. Verificar campo `"files"` no `package.json`
3. Testar: `npm pack --dry-run`

### Line endings incorretos
```bash
# Re-normalizar todos os arquivos
git add --renormalize .
git commit -m "Normalize line endings"
```

### EditorConfig não funcionando
- Instalar plugin EditorConfig no seu editor
- VSCode: `EditorConfig for VS Code`
- JetBrains: Built-in
- Vim: `editorconfig-vim`

### Build artifacts incorretos
```bash
# Limpar completamente e rebuildar
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build

# Verificar arquivos gerados
ls -lh dist/
```

### Testes falhando antes de publicar
```bash
# Rodar apenas testes unitários (ignorar integração que precisa de API key)
npm test -- --run tests/unit

# Se testes de integração falharem, verifique:
# - Variável de ambiente NFE_API_KEY está definida?
# - API está acessível?
```

## � Secrets e Variáveis de Ambiente

### Desenvolvimento Local
```bash
# .env (não versionado - criar localmente)
NFE_API_KEY=your-api-key-here
NFE_ENVIRONMENT=development

# Usar em testes de integração
# Os testes checam se NFE_API_KEY existe antes de rodar
```

### GitHub Actions
**Secrets necessários** (configurar em Settings > Secrets):
- `NPM_TOKEN` - Token de publicação no NPM (obrigatório para publish)

**Variables opcionais**:
- Nenhuma necessária no momento

### Como Configurar Secrets no GitHub
1. Acesse: `https://github.com/nfe/client-nodejs/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Nome: `NPM_TOKEN`
4. Valor: Token gerado no npmjs.com (formato: `npm_xxxxxxxxxxxxx`)
5. Salvar

## 📦 Preparação para Publicação

### Checklist Completo
```bash
# ✅ 1. Versão atualizada
cat package.json | grep version
# Deve mostrar: "version": "3.0.0"

# ✅ 2. CHANGELOG atualizado
cat CHANGELOG.md | head -20
# Verificar se versão 3.0.0 está documentada

# ✅ 3. OpenAPI specs válidos
npm run validate:spec
# Deve mostrar: "✅ All specifications are valid!"

# ✅ 4. Tipos gerados
npm run generate
# Deve gerar 7 de 12 specs

# ✅ 5. TypeScript compila
npm run typecheck
# Deve passar sem erros

# ✅ 6. Testes unitários passando
npm test -- --run tests/unit
# Deve mostrar: "253 passed"

# ✅ 7. Build funciona
npm run build
# Deve gerar dist/ com 6 arquivos

# ✅ 8. Verificar conteúdo do pacote
npm pack --dry-run
# Deve listar 10 arquivos (dist/ + docs)

# ✅ 9. Testar instalação local
npm pack
# Gera nfe-io-3.0.0.tgz para testar
```

## 🚀 Processo de Publicação

### Publicação Manual
```bash
# 1. Garantir que está na main
git checkout main
git pull origin main

# 2. Atualizar versão (se não estiver)
npm version 3.0.0 --no-git-tag-version

# 3. Build e validação completa
npm run build
npm test -- --run tests/unit

# 4. Dry-run (simula publicação)
npm publish --dry-run

# 5. Publicar (ATENÇÃO: Ação irreversível!)
npm publish --access public

# 6. Criar tag no Git
git tag v3.0.0
git push origin v3.0.0

# 7. Criar Release no GitHub
# https://github.com/nfe/client-nodejs/releases/new
```

### Publicação via GitHub Actions (Recomendado)
```bash
# MÉTODO 1: Via Release (Mais completo)
# ====================================

# 1. Criar e push tag
git tag v3.0.0
git push origin v3.0.0

# 2. Criar Release no GitHub
# Acesse: https://github.com/nfe/client-nodejs/releases/new
# Preencha:
#   - Choose a tag: v3.0.0
#   - Release title: v3.0.0 - [Nome da Release]
#   - Description: [Cole o CHANGELOG desta versão]
#   - Clique em "Publish release"

# ✅ O workflow publish.yml será acionado automaticamente


# MÉTODO 2: Manual Dispatch (Mais rápido)
# ========================================

# 1. Acesse: https://github.com/nfe/client-nodejs/actions/workflows/publish.yml
# 2. Clique em "Run workflow" (botão à direita)
# 3. Selecione:
#    - Branch: main
#    - Tag to publish: v3.0.0
# 4. Clique em "Run workflow"

# ✅ O workflow rodará build + tests + publish


# O que o workflow faz automaticamente:
# - ✅ Checkout do código
# - ✅ Setup Node.js 20
# - ✅ Install dependencies
# - ✅ Valida OpenAPI specs
# - ✅ Gera tipos TypeScript
# - ✅ Roda testes
# - ✅ Type checking
# - ✅ Build
# - ✅ Verifica artifacts
# - ✅ Dry-run
# - ✅ Publica no NPM com provenance
# - ✅ Cria summary no GitHub
```

### Verificar Publicação
```bash
# Ver pacote no NPM (aguardar ~1 minuto após publicar)
open https://www.npmjs.com/package/nfe-io

# Verificar versão específica
npm view nfe-io@3.0.0

# Testar instalação em projeto novo
mkdir test-nfe && cd test-nfe
npm init -y
npm install nfe-io@3.0.0

# Verificar exports ESM
node --input-type=module -e "import {NfeClient} from 'nfe-io'; console.log('✅ ESM:', NfeClient);"

# Verificar exports CommonJS
node -e "const {NfeClient} = require('nfe-io'); console.log('✅ CJS:', NfeClient);"

# Verificar tipos TypeScript
echo "import { NfeClient } from 'nfe-io'; const c: NfeClient = null as any;" > test.ts
npx -y typescript tsc --noEmit test.ts && echo "✅ Types OK"
```

### Troubleshooting de Publicação

#### Erro: "You must be logged in"
```bash
# Solução: Fazer login no NPM
npm login

# Verificar usuário logado
npm whoami
```

#### Erro: "You do not have permission to publish 'nfe-io'"
```bash
# Solução 1: Verificar owners do pacote
npm owner ls nfe-io

# Solução 2: Adicionar seu usuário (executar pelo owner atual)
npm owner add SEU_USUARIO nfe-io
```

#### Erro: "Version 3.0.0 already exists"
```bash
# Solução: Incrementar versão no package.json
npm version patch  # 3.0.0 -> 3.0.1
npm version minor  # 3.0.0 -> 3.1.0
npm version major  # 3.0.0 -> 4.0.0

# Ou manualmente editar package.json
```

#### Erro no GitHub Actions: "NPM_TOKEN not found"
```bash
# Solução: Adicionar secret no GitHub
# 1. Acesse: https://github.com/nfe/client-nodejs/settings/secrets/actions
# 2. New repository secret
# 3. Name: NPM_TOKEN
# 4. Value: (token do npmjs.com)
# 5. Add secret
```

#### Erro: "This package has been marked as private"
```bash
# Solução: Remover "private": true do package.json
# Verificar que não existe essa linha no package.json
```

#### Build falha com erros TypeScript
```bash
# Solução: Limpar e rebuildar
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run typecheck
npm run build
```

#### Testes falhando no CI
```bash
# Solução: Rodar apenas testes unitários
# O workflow já está configurado para ignorar testes de integração
# que precisam de API key real

# Verificar localmente:
npm test -- --run tests/unit

# Se falhar localmente, debugar:
npm test -- --run tests/unit/companies.test.ts
```

## �️ Manutenção Contínua

### Atualizando Dependências
```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências de desenvolvimento
npm update --save-dev

# Atualizar major versions (com cuidado)
npx npm-check-updates -u
npm install

# Rodar testes após atualizar
npm test -- --run
```

### Regenerando Tipos do OpenAPI
```bash
# Quando specs OpenAPI mudarem
npm run validate:spec
npm run generate

# Commit changes
git add src/generated/
git commit -m "chore: regenerate OpenAPI types"
```

### Mantendo .gitignore Limpo
```bash
# Ver arquivos ignorados
git status --ignored

# Limpar arquivos desnecessários
git clean -xdn  # Dry-run (mostra o que seria removido)
git clean -xdf  # Remove (cuidado!)
```

### Monitorando Tamanho do Pacote
```bash
# Verificar tamanho atual
npm pack --dry-run | grep "package size"

# Analisar o que contribui para o tamanho
npx package-size nfe-io

# Objetivo: Manter < 150 KB (tarball)
```

## �📚 Referências

### Documentação Oficial
- **Git Ignore**: https://git-scm.com/docs/gitignore
- **NPM Files**: https://docs.npmjs.com/cli/v9/using-npm/developers#keeping-files-out-of-your-package
- **NPM Publish**: https://docs.npmjs.com/cli/v9/commands/npm-publish
- **EditorConfig**: https://editorconfig.org/
- **Git Attributes**: https://git-scm.com/docs/gitattributes
- **TypeScript Config**: https://www.typescriptlang.org/tsconfig
- **Tsup**: https://tsup.egoist.dev/
- **Vitest**: https://vitest.dev/

### Ferramentas Úteis
- **npm-check-updates**: Atualizar dependências
- **package-size**: Analisar tamanho do pacote
- **size-limit**: Limitar tamanho do bundle
- **publint**: Validar configuração de publicação

### Recursos do Projeto
- **GitHub Repo**: https://github.com/nfe/client-nodejs
- **NPM Package**: https://www.npmjs.com/package/nfe-io
- **Issues**: https://github.com/nfe/client-nodejs/issues
- **Releases**: https://github.com/nfe/client-nodejs/releases
- **CI/CD**: https://github.com/nfe/client-nodejs/actions

### Documentação Interna
- [README.md](./README.md) - Guia principal
- [CHANGELOG.md](./CHANGELOG.md) - Histórico de versões
- [MIGRATION.md](./MIGRATION.md) - Guia de migração v2→v3
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia para contribuidores
- [AGENTS.md](./AGENTS.md) - Instruções para AI agents

---

**Última atualização**: 2026-01-13  
**Versão**: 3.0.0  
**Status**: ✅ Pronto para publicação
