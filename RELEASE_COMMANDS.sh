#!/bin/bash
# NFE.io SDK v3.0.0 - Release Commands
# 
# Este arquivo contém todos os comandos necessários para
# completar o release do SDK v3.0.0
#
# Uso: bash RELEASE_COMMANDS.sh
#      ou: chmod +x RELEASE_COMMANDS.sh && ./RELEASE_COMMANDS.sh
#
# Para script automatizado, use: ./scripts/release.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 NFE.io SDK v3.0.0 - Release Commands${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ============================================================================
# BLOCO 1: VALIDAÇÃO PRÉ-RELEASE
# ============================================================================
echo -e "${YELLOW}📋 BLOCO 1: Validação Pré-Release${NC}"
echo -e "${YELLOW}----------------------------------${NC}"
echo ""

# Verificar status git
echo -e "${GRAY}▸ Verificando status git...${NC}"
git status

# TypeCheck
echo ""
echo -e "${GRAY}▸ TypeScript compilation check...${NC}"
npm run typecheck

# Build
echo ""
echo -e "${GRAY}▸ Build final...${NC}"
npm run build

# Verificar package
echo ""
echo -e "${GRAY}▸ Verificando conteúdo do package...${NC}"
npm pack --dry-run

echo ""
echo -e "${GREEN}✅ BLOCO 1 completo!${NC}"
echo ""

# ============================================================================
# BLOCO 2: GIT COMMIT & TAG
# ============================================================================
echo -e "${YELLOW}📝 BLOCO 2: Git Commit & Tag${NC}"
echo -e "${YELLOW}----------------------------${NC}"
echo ""

# Adicionar arquivos
echo -e "${GRAY}▸ git add...${NC}"
git add .

# Commit
echo -e "${GRAY}▸ git commit...${NC}"
git commit -m "Release v3.0.0

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
"

# Criar tag
echo -e "${GRAY}▸ git tag...${NC}"
git tag v3.0.0 -a -m "Release v3.0.0 - Complete TypeScript Rewrite

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
"

# Push
echo -e "${GRAY}▸ git push...${NC}"
git push origin v3
git push origin v3.0.0

echo ""
echo -e "${GREEN}✅ BLOCO 2 completo!${NC}"
echo ""

# ============================================================================
# BLOCO 3: NPM PUBLISH
# ============================================================================
echo -e "${YELLOW}📦 BLOCO 3: NPM Publish${NC}"
echo -e "${YELLOW}-----------------------${NC}"
echo ""

# Verificar login
echo -e "${GRAY}▸ Verificando npm login...${NC}"
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Não logado no NPM! Execute: npm login${NC}"
    exit 1
fi
npm whoami

# Dry-run
echo ""
echo -e "${GRAY}▸ NPM publish dry-run...${NC}"
npm publish --dry-run

# Confirmação
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Você está prestes a publicar @nfe-io/sdk@3.0.0 para NPM!${NC}"
echo -e "${YELLOW}   Isso é irreversível!${NC}"
echo ""
read -p "Continuar com publicação? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Publish real
    echo ""
    echo -e "${GRAY}▸ Publicando para NPM...${NC}"
    npm publish --access public
    
    # Verificar publicação
    echo ""
    echo -e "${GRAY}▸ Verificando publicação...${NC}"
    npm view @nfe-io/sdk version
    npm view @nfe-io/sdk dist-tags
    
    echo ""
    echo -e "${GREEN}✅ BLOCO 3 completo!${NC}"
else
    echo ""
    echo -e "${RED}❌ Publicação cancelada pelo usuário${NC}"
    exit 1
fi

echo ""

# ============================================================================
# BLOCO 4: PÓS-RELEASE
# ============================================================================
echo -e "${YELLOW}🎉 BLOCO 4: Pós-Release${NC}"
echo -e "${YELLOW}-----------------------${NC}"
echo ""

echo -e "${CYAN}Próximas ações manuais:${NC}"
echo ""
echo -e "${GRAY}1. GitHub Release:${NC}"
echo -e "   ${BLUE}https://github.com/nfe/client-nodejs/releases/new${NC}"
echo -e "   ${GRAY}- Tag: v3.0.0${NC}"
echo -e "   ${GRAY}- Title: v3.0.0 - Complete TypeScript Rewrite${NC}"
echo -e "   ${GRAY}- Description: Copiar de CHANGELOG.md${NC}"
echo ""
echo -e "${GRAY}2. Atualizar website NFE.io:${NC}"
echo -e "   ${GRAY}- Adicionar exemplos v3 na documentação${NC}"
echo -e "   ${GRAY}- Atualizar guia de instalação${NC}"
echo -e "   ${GRAY}- Adicionar link para MIGRATION.md${NC}"
echo ""
echo -e "${GRAY}3. Anunciar release:${NC}"
echo -e "   ${GRAY}- Blog post${NC}"
echo -e "   ${GRAY}- Newsletter${NC}"
echo -e "   ${GRAY}- Twitter/X: @nfeio${NC}"
echo -e "   ${GRAY}- Developer community${NC}"
echo ""
echo -e "${GRAY}4. Monitorar:${NC}"
echo -e "   ${BLUE}- NPM downloads: https://www.npmjs.com/package/@nfe-io/sdk${NC}"
echo -e "   ${BLUE}- GitHub issues: https://github.com/nfe/client-nodejs/issues${NC}"
echo -e "   ${GRAY}- User feedback nos primeiros dias${NC}"
echo ""
echo -e "${GRAY}5. Preparar v3.1.0:${NC}"
echo -e "   ${GRAY}- Criar milestone no GitHub${NC}"
echo -e "   ${GRAY}- Adicionar issues para melhorias${NC}"
echo -e "   ${GRAY}- Planejar features baseado em feedback${NC}"
echo ""

echo -e "${GREEN}✅ Release v3.0.0 completo!${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎊 Parabéns! NFE.io SDK v3.0.0 foi lançado com sucesso!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
