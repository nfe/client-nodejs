# 🔄 Comparação de Scripts de Release

## 📊 Resumo Executivo

| Feature | Windows (PowerShell) | Linux/macOS (Bash) |
|---------|---------------------|-------------------|
| **Script Automatizado** | `scripts/release.ps1` | `scripts/release.sh` |
| **Script Interativo** | `RELEASE_COMMANDS.ps1` | `RELEASE_COMMANDS.sh` |
| **Cores no Output** | ✅ Sim | ✅ Sim |
| **Confirmações** | ✅ Sim | ✅ Sim |
| **Dry-Run Mode** | ✅ Sim (`-DryRun`) | ✅ Sim (`--dry-run`) |
| **Skip Tests** | ✅ Sim (`-SkipTests`) | ✅ Sim (`--skip-tests`) |
| **Skip Git** | ✅ Sim (`-SkipGit`) | ✅ Sim (`--skip-git`) |
| **Help** | ✅ Sim (`Get-Help`) | ✅ Sim (`--help`) |

## 🎯 Scripts Automatizados

### Windows: `scripts/release.ps1`

```powershell
# Sintaxe
.\scripts\release.ps1 [-DryRun] [-SkipTests] [-SkipGit]

# Exemplos
.\scripts\release.ps1                    # Release completo
.\scripts\release.ps1 -DryRun            # Teste sem publicar
.\scripts\release.ps1 -SkipTests         # Pular testes
.\scripts\release.ps1 -DryRun -SkipTests # Teste rápido
```

**Funcionalidades**:
- ✅ Validação TypeScript
- ✅ ESLint check (aceita warnings)
- ✅ Testes (opcional com -SkipTests)
- ✅ Build do SDK
- ✅ Verificação de dist/
- ✅ Criação de tarball
- ✅ Comandos git (opcional com -SkipGit)
- ✅ NPM publish (opcional com -DryRun)
- ✅ Resumo final colorido

### Linux/macOS: `scripts/release.sh`

```bash
# Primeira execução
chmod +x scripts/release.sh

# Sintaxe
./scripts/release.sh [--dry-run] [--skip-tests] [--skip-git]

# Exemplos
./scripts/release.sh                      # Release completo
./scripts/release.sh --dry-run            # Teste sem publicar
./scripts/release.sh --skip-tests         # Pular testes
./scripts/release.sh --dry-run --skip-tests # Teste rápido
```

**Funcionalidades**:
- ✅ Validação TypeScript
- ✅ ESLint check (aceita warnings)
- ✅ Testes (opcional com --skip-tests)
- ✅ Build do SDK
- ✅ Verificação de dist/
- ✅ Criação de tarball
- ✅ Comandos git (opcional com --skip-git)
- ✅ NPM publish (opcional com --dry-run)
- ✅ Resumo final colorido (ANSI colors)

## 🎨 Scripts Interativos

### Windows: `RELEASE_COMMANDS.ps1`

```powershell
# Executar
.\RELEASE_COMMANDS.ps1
```

**Fluxo**:
1. **Validação** (automática)
   - TypeScript check
   - Build
   - Verificação de package

2. **Git Operations** (confirmação)
   - Mostra comandos git
   - Pergunta: "Executar comandos git agora? (y/N)"
   - Se sim: executa add/commit/tag/push
   - Se não: mostra comandos para executar manualmente

3. **NPM Publish** (confirmação)
   - Verifica login npm
   - Executa dry-run
   - Pergunta: "Continuar com publicação? (y/N)"
   - Se sim: publica no NPM
   - Se não: cancela

4. **Pós-Release**
   - Lista próximas ações manuais
   - Links para GitHub Release
   - Checklist de comunicação

### Linux/macOS: `RELEASE_COMMANDS.sh`

```bash
# Primeira execução
chmod +x RELEASE_COMMANDS.sh

# Executar
./RELEASE_COMMANDS.sh
```

**Fluxo**: Idêntico ao PowerShell
- Mesmas 4 fases
- Mesmas confirmações interativas
- Output colorido ANSI
- Mesmas funcionalidades

## 📋 Documentação de Suporte

| Arquivo | Descrição | Tamanho |
|---------|-----------|---------|
| `README_RELEASE.md` | Guia completo de release (todas plataformas) | 6.1 KB |
| `RELEASE_CHECKLIST.md` | Checklist detalhado pré/pós-release | 4.6 KB |
| `CHANGELOG.md` | Release notes v3.0.0 | 5.4 KB |
| `MIGRATION.md` | Guia migração v2→v3 | 14.8 KB |

## 🔄 Diferenças de Implementação

### Cores no Terminal

**PowerShell**:
```powershell
Write-Host "Mensagem" -ForegroundColor Green
```

**Bash**:
```bash
echo -e "${GREEN}Mensagem${NC}"
```

### Parâmetros

**PowerShell**:
```powershell
param(
    [switch]$DryRun = $false,
    [switch]$SkipTests = $false
)
```

**Bash**:
```bash
for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
        --skip-tests) SKIP_TESTS=true ;;
    esac
done
```

### Confirmações

**PowerShell**:
```powershell
$confirm = Read-Host "Continuar? (y/N)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    # Executar
}
```

**Bash**:
```bash
read -p "Continuar? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Executar
fi
```

## 🎯 Qual Script Usar?

### Use Scripts Automatizados quando:
- ✅ Você quer release completo automático
- ✅ Precisa testar com dry-run
- ✅ Quer controle via parâmetros
- ✅ Execução em CI/CD
- ✅ Prefere não responder confirmações

### Use Scripts Interativos quando:
- ✅ Primeira vez fazendo release
- ✅ Quer ver cada passo em detalhes
- ✅ Quer controle manual sobre git/npm
- ✅ Prefere confirmações antes de ações irreversíveis
- ✅ Aprendendo o processo

## 🚀 Recomendação por Cenário

### 1. Primeiro Release (Aprendizado)
```bash
# Windows
.\RELEASE_COMMANDS.ps1

# Linux/macOS
./RELEASE_COMMANDS.sh
```
**Por quê?** Interativo, mostra cada passo, pede confirmação.

### 2. Teste Rápido (CI/CD)
```bash
# Windows
.\scripts\release.ps1 -DryRun -SkipTests

# Linux/macOS
./scripts/release.sh --dry-run --skip-tests
```
**Por quê?** Rápido, sem testes, sem publicação real.

### 3. Release de Produção (Confiante)
```bash
# Windows
.\scripts\release.ps1

# Linux/macOS
./scripts/release.sh
```
**Por quê?** Completo, com todas validações, publica no NPM.

### 4. Apenas Validação (Sem Git/NPM)
```bash
# Windows
.\scripts\release.ps1 -SkipGit -DryRun

# Linux/macOS
./scripts/release.sh --skip-git --dry-run
```
**Por quê?** Valida código mas não mexe em git nem NPM.

## 📝 Checklist de Uso

Antes de executar qualquer script:

- [ ] `npm run typecheck` passou
- [ ] `npm run build` gerou dist/
- [ ] README.md é versão v3
- [ ] package.json version = 3.0.0
- [ ] Logado no NPM (`npm whoami`)
- [ ] Git configurado e permissões OK

## 🆘 Troubleshooting Específico

### PowerShell: "Execution policy error"
```powershell
# Solução temporária
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Ou execute com:
powershell -ExecutionPolicy Bypass -File .\scripts\release.ps1
```

### Bash: "Permission denied"
```bash
# Dar permissão de execução
chmod +x scripts/release.sh
chmod +x RELEASE_COMMANDS.sh
```

### Bash: "command not found: npm"
```bash
# Verificar PATH
echo $PATH

# Ou usar caminho completo
/usr/local/bin/npm run build
```

## 🎉 Conclusão

Ambas as implementações (PowerShell e Bash) são **totalmente equivalentes** em funcionalidade. A escolha depende apenas do sistema operacional:

- **Windows** → Use `.ps1` scripts
- **Linux/macOS** → Use `.sh` scripts
- **WSL no Windows** → Pode usar ambos!

Todos os scripts foram testados e estão prontos para uso em produção! 🚀
