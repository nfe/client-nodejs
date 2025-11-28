# NFE.io SDK v3.0.0 - Release Commands (PowerShell)
#
# Este arquivo contém todos os comandos necessários para
# completar o release do SDK v3.0.0
#
# Uso: Execute os blocos na ordem ou use .\scripts\release.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 NFE.io SDK v3.0.0 - Release Commands" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# BLOCO 1: VALIDAÇÃO PRÉ-RELEASE
# ============================================================================
Write-Host "📋 BLOCO 1: Validação Pré-Release" -ForegroundColor Yellow
Write-Host "----------------------------------`n" -ForegroundColor Yellow

# Verificar status git
Write-Host "▸ Verificando status git..." -ForegroundColor Gray
git status

# TypeCheck
Write-Host "`n▸ TypeScript compilation check..." -ForegroundColor Gray
npm run typecheck

# Build
Write-Host "`n▸ Build final..." -ForegroundColor Gray
npm run build

# Verificar package
Write-Host "`n▸ Verificando conteúdo do package..." -ForegroundColor Gray
npm pack --dry-run

Write-Host "`n✅ BLOCO 1 completo!`n" -ForegroundColor Green

# ============================================================================
# BLOCO 2: GIT COMMIT & TAG
# ============================================================================
Write-Host "📝 BLOCO 2: Git Commit & Tag" -ForegroundColor Yellow
Write-Host "----------------------------`n" -ForegroundColor Yellow

$commitMessage = @"
Release v3.0.0

- Complete TypeScript rewrite with zero runtime dependencies
- Modern async/await API with full type safety
- 5 core resources: ServiceInvoices, Companies, LegalPeople, NaturalPeople, Webhooks
- 107 tests passing (88% coverage)
- Dual ESM/CommonJS support
- Node.js 18+ required (for native fetch API)
- Comprehensive documentation (README, MIGRATION, CHANGELOG)

Breaking changes:
- Package renamed: nfe → @nfe-io/sdk
- Minimum Node.js: 12 → 18
- API changed: callbacks → async/await
- Removed: when dependency (using native promises)

See MIGRATION.md for complete v2→v3 migration guide.
See CHANGELOG.md for detailed release notes.
"@

$tagMessage = @"
Release v3.0.0 - Complete TypeScript Rewrite

Major version with full TypeScript rewrite, zero dependencies, and modern async/await API.

Highlights:
- 🎯 TypeScript 5.3+ with strict mode
- 📦 Zero runtime dependencies
- 🚀 Native fetch API (Node.js 18+)
- ✅ 107 tests (88% coverage)
- 📚 Complete documentation suite
- 🔄 Dual ESM/CommonJS support

Breaking Changes:
See MIGRATION.md for migration guide from v2.

Full changelog: https://github.com/nfe/client-nodejs/blob/v3/CHANGELOG.md
"@

Write-Host "Comandos Git:" -ForegroundColor Cyan
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m `"...(mensagem acima)...`"" -ForegroundColor White
Write-Host "git tag v3.0.0 -a -m `"...(mensagem acima)...`"" -ForegroundColor White
Write-Host "git push origin v3" -ForegroundColor White
Write-Host "git push origin v3.0.0`n" -ForegroundColor White

$confirm = Read-Host "Executar comandos git agora? (y/N)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host "`n▸ git add..." -ForegroundColor Gray
    git add .
    
    Write-Host "▸ git commit..." -ForegroundColor Gray
    git commit -m $commitMessage
    
    Write-Host "▸ git tag..." -ForegroundColor Gray
    git tag v3.0.0 -a -m $tagMessage
    
    Write-Host "▸ git push..." -ForegroundColor Gray
    git push origin v3
    git push origin v3.0.0
    
    Write-Host "`n✅ BLOCO 2 completo!`n" -ForegroundColor Green
}
else {
    Write-Host "`n⏭️  BLOCO 2 pulado (execute comandos manualmente)`n" -ForegroundColor Yellow
}

# ============================================================================
# BLOCO 3: NPM PUBLISH
# ============================================================================
Write-Host "📦 BLOCO 3: NPM Publish" -ForegroundColor Yellow
Write-Host "-----------------------`n" -ForegroundColor Yellow

# Verificar login
Write-Host "▸ Verificando npm login..." -ForegroundColor Gray
try {
    npm whoami
}
catch {
    Write-Host "❌ Não logado no NPM! Execute: npm login" -ForegroundColor Red
    exit 1
}

# Dry-run
Write-Host "`n▸ NPM publish dry-run..." -ForegroundColor Gray
npm publish --dry-run

# Confirmação
Write-Host "`n⚠️  ATENÇÃO: Você está prestes a publicar @nfe-io/sdk@3.0.0 para NPM!" -ForegroundColor Yellow
Write-Host "   Isso é irreversível!`n" -ForegroundColor Yellow

$confirmPublish = Read-Host "Continuar com publicação? (y/N)"
if ($confirmPublish -eq 'y' -or $confirmPublish -eq 'Y') {
    # Publish real
    Write-Host "`n▸ Publicando para NPM..." -ForegroundColor Gray
    npm publish --access public
    
    # Verificar publicação
    Write-Host "`n▸ Verificando publicação..." -ForegroundColor Gray
    npm view @nfe-io/sdk version
    npm view @nfe-io/sdk dist-tags
    
    Write-Host "`n✅ BLOCO 3 completo!`n" -ForegroundColor Green
}
else {
    Write-Host "`n❌ Publicação cancelada pelo usuário`n" -ForegroundColor Red
}

# ============================================================================
# BLOCO 4: PÓS-RELEASE
# ============================================================================
Write-Host "🎉 BLOCO 4: Pós-Release" -ForegroundColor Yellow
Write-Host "-----------------------`n" -ForegroundColor Yellow

Write-Host "Próximas ações manuais:`n" -ForegroundColor Cyan

Write-Host "1. GitHub Release:" -ForegroundColor White
Write-Host "   https://github.com/nfe/client-nodejs/releases/new" -ForegroundColor Gray
Write-Host "   - Tag: v3.0.0" -ForegroundColor Gray
Write-Host "   - Title: v3.0.0 - Complete TypeScript Rewrite" -ForegroundColor Gray
Write-Host "   - Description: Copiar de CHANGELOG.md`n" -ForegroundColor Gray

Write-Host "2. Atualizar website NFE.io:" -ForegroundColor White
Write-Host "   - Adicionar exemplos v3 na documentação" -ForegroundColor Gray
Write-Host "   - Atualizar guia de instalação" -ForegroundColor Gray
Write-Host "   - Adicionar link para MIGRATION.md`n" -ForegroundColor Gray

Write-Host "3. Anunciar release:" -ForegroundColor White
Write-Host "   - Blog post" -ForegroundColor Gray
Write-Host "   - Newsletter" -ForegroundColor Gray
Write-Host "   - Twitter/X: @nfeio" -ForegroundColor Gray
Write-Host "   - Developer community`n" -ForegroundColor Gray

Write-Host "4. Monitorar:" -ForegroundColor White
Write-Host "   - NPM downloads: https://www.npmjs.com/package/@nfe-io/sdk" -ForegroundColor Gray
Write-Host "   - GitHub issues: https://github.com/nfe/client-nodejs/issues" -ForegroundColor Gray
Write-Host "   - User feedback nos primeiros dias`n" -ForegroundColor Gray

Write-Host "5. Preparar v3.1.0:" -ForegroundColor White
Write-Host "   - Criar milestone no GitHub" -ForegroundColor Gray
Write-Host "   - Adicionar issues para melhorias" -ForegroundColor Gray
Write-Host "   - Planejar features baseado em feedback`n" -ForegroundColor Gray

Write-Host "✅ Release v3.0.0 preparado!`n" -ForegroundColor Green

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎊 Parabéns! NFE.io SDK v3.0.0 está pronto para lançamento!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
