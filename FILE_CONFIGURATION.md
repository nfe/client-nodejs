# 📁 Configuração de Arquivos - NFE.io SDK v3

Este documento descreve a configuração de arquivos de controle do projeto para o SDK v3.

## 📋 Arquivos de Configuração

### `.gitignore`
**Propósito**: Define quais arquivos/diretórios o Git deve ignorar.

**Principais exclusões**:
- ✅ `node_modules/` - Dependências (instaladas via npm)
- ✅ `dist/` - Código compilado (gerado pelo build)
- ✅ `coverage/` - Relatórios de cobertura de testes
- ✅ `*.tgz` - Pacotes NPM gerados
- ✅ `.env*` - Variáveis de ambiente
- ✅ IDE configs - `.vscode/`, `.idea/`, `*.iml`
- ✅ OS files - `.DS_Store`, `Thumbs.db`
- ✅ Logs - `*.log`, `npm-debug.log*`

**O que é versionado**:
- ✅ `src/` - Código-fonte TypeScript
- ✅ `tests/` - Testes
- ✅ Arquivos de configuração (`.eslintrc.cjs`, `tsconfig.json`, etc)
- ✅ Documentação (`README.md`, `CHANGELOG.md`, etc)
- ✅ Scripts (`scripts/`)

### `.npmignore`
**Propósito**: Define o que **não** será publicado no NPM.

**Excluído do pacote NPM**:
- ❌ `src/` - Código-fonte (publicamos apenas `dist/`)
- ❌ `tests/` - Testes unitários
- ❌ `examples/` - Exemplos de código
- ❌ `scripts/` - Scripts de desenvolvimento
- ❌ Configs de desenvolvimento (`.eslintrc`, `tsconfig.json`, etc)
- ❌ Documentação interna (`AGENTS.md`, `CONTRIBUTING.md`, etc)
- ❌ CI/CD configs (`.github/`, `.travis.yml`)
- ❌ Arquivos legados (`lib/`, `VERSION`, `CHANGELOG` sem extensão)

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

## 📊 Tamanho do Pacote NPM

```
Arquivo                  Tamanho
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dist/index.js            70.5 KB  (ESM)
dist/index.cjs           72.2 KB  (CommonJS)
dist/index.d.ts          50.9 KB  (TypeScript types)
dist/*.map              286.3 KB  (Source maps)
README.md                13.0 KB
CHANGELOG.md              5.5 KB
MIGRATION.md             15.2 KB
package.json              2.2 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total (tarball)         109.4 KB
Total (unpacked)        566.5 KB
```

## ✅ Validação

### Verificar o que será publicado no NPM
```bash
npm pack --dry-run
```

### Testar instalação local
```bash
# 1. Criar tarball
npm pack

# 2. Instalar em projeto teste
cd ../test-project
npm install ../client-nodejs/nfe-io-sdk-3.0.0.tgz

# 3. Verificar imports
node --input-type=module --eval "import { NfeClient } from '@nfe-io/sdk'; console.log('OK');"
```

### Verificar arquivos ignorados pelo Git
```bash
git status --ignored
```

## 🎯 Comparação v2 vs v3

| Aspecto | v2 (Legado) | v3 (Atual) |
|---------|-------------|------------|
| **Código publicado** | `lib/*.js` | `dist/*.{js,cjs,d.ts}` |
| **Line endings** | Inconsistente | LF (via .gitattributes) |
| **Indentação** | Mista | 2 espaços (via .editorconfig) |
| **Docs incluídas** | README | README + CHANGELOG + MIGRATION |
| **Source maps** | ❌ Não | ✅ Sim (.map files) |
| **TypeScript types** | ❌ Não | ✅ Sim (.d.ts files) |
| **Dual package** | ❌ Não | ✅ ESM + CommonJS |
| **Tamanho tarball** | ~50 KB | 109 KB (+docs +types) |

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

## 📚 Referências

- **Git**: https://git-scm.com/docs/gitignore
- **NPM**: https://docs.npmjs.com/cli/v9/using-npm/developers#keeping-files-out-of-your-package
- **EditorConfig**: https://editorconfig.org/
- **Git Attributes**: https://git-scm.com/docs/gitattributes

---

**Última atualização**: 2025-11-12  
**Versão**: 3.0.0
