# 📚 Exemplos Reais do SDK NFE.io v5

Este diretório contém exemplos práticos que você pode executar usando suas credenciais do arquivo `.env.test`.

## 🚀 Pré-requisitos

### Setup Automático (Recomendado)

Execute o script de setup interativo:

```bash
npm run examples:setup
```

Este script irá:
- ✅ Solicitar sua API Key
- ✅ Configurar environment (production/development)
- ✅ Criar arquivo `.env.test` automaticamente
- ✅ Verificar e fazer build se necessário

### Setup Manual

1. **Configure suas credenciais** no arquivo `.env.test` na raiz do projeto:
   ```bash
   NFE_API_KEY=sua-chave-api-aqui
   NFE_TEST_ENVIRONMENT=development
   ```

2. **Instale as dependências** (se ainda não fez):
   ```bash
   npm install
   ```

3. **Faça o build do projeto**:
   ```bash
   npm run build
   ```

### Teste sua Configuração

```bash
# Testar conexão e credenciais
npm run examples:test

# Ou diretamente
node examples/test-connection.js
```

## 🎯 Execução Rápida com Helper Script

Use o script helper para executar exemplos facilmente:

```bash
# Modo interativo - menu de seleção
node examples/run-examples.js

# Executar exemplo específico (1-4)
node examples/run-examples.js 1

# Executar todos em sequência
node examples/run-examples.js all
```

**Benefícios do helper**:
- ✅ Menu interativo com descrições
- ✅ Execução individual ou em lote
- ✅ Feedback visual de progresso
- ✅ Tratamento de erros amigável
- ✅ Ordem recomendada de execução

## 📝 Exemplos Disponíveis

### 0. **test-connection.js** - Teste de Conexão ⚡ (COMECE AQUI!)
Script de diagnóstico que verifica sua configuração:
- ✅ Valida credenciais do .env.test
- ✅ Testa conexão com a API
- ✅ Lista empresas disponíveis
- ✅ Verifica recursos do SDK
- ✅ Confirma build do projeto

```bash
node examples/test-connection.js
```

**Execute este primeiro para garantir que tudo está configurado corretamente!**

---

### 1. **real-world-invoice.js** - Emissão Completa de Nota Fiscal ⭐
Exemplo mais completo que demonstra todo o fluxo de emissão de nota fiscal:
- ✅ Buscar empresa configurada
- ✅ Criar/buscar tomador (pessoa jurídica)
- ✅ Emitir nota fiscal com polling automático
- ✅ Enviar nota por email
- ✅ Baixar PDF e XML da nota

```bash
node examples/real-world-invoice.js
```

**Saída esperada**: Nota fiscal emitida + PDF e XML salvos localmente

---

### 2. **real-world-list-invoices.js** - Consulta de Notas Fiscais
Demonstra como listar e consultar notas fiscais existentes:
- ✅ Listar empresas da conta
- ✅ Listar notas fiscais com paginação
- ✅ Consultar detalhes completos de uma nota
- ✅ Exibir estatísticas (total, valor médio)

```bash
node examples/real-world-list-invoices.js
```

**Saída esperada**: Lista de notas fiscais + detalhes completos da primeira nota

---

### 3. **real-world-manage-people.js** - Gerenciamento de Clientes
Demonstra o CRUD completo de pessoas jurídicas e físicas:
- ✅ Criar pessoa jurídica (empresa cliente)
- ✅ Criar pessoa física (cliente individual)
- ✅ Listar pessoas cadastradas
- ✅ Buscar por CPF/CNPJ
- ✅ Atualizar dados cadastrais

```bash
node examples/real-world-manage-people.js
```

**Saída esperada**: Pessoas criadas e listadas + demonstração de busca

---

### 4. **real-world-webhooks.js** - Configuração de Webhooks
Demonstra como configurar webhooks para receber eventos:
- ✅ Listar webhooks configurados
- ✅ Criar novo webhook
- ✅ Exemplo de código para validar assinatura
- ✅ Melhores práticas de implementação

```bash
node examples/real-world-webhooks.js
```

**Nota**: Este exemplo não cria webhook real (precisa de URL HTTPS válida)

---

## 🎯 Exemplos de Desenvolvimento

### **basic-usage.ts** - Exemplo TypeScript Básico
Demonstra uso do SDK com TypeScript e tipos completos.

### **basic-usage-esm.js** - Exemplo ESM
Demonstra uso com import ES modules.

### **basic-usage-cjs.cjs** - Exemplo CommonJS
Demonstra uso com require() para compatibilidade.

### **all-resources-demo.js** - Tour Completo da API
Demonstra todos os recursos disponíveis no SDK.

### **jsdoc-intellisense-demo.ts** - IntelliSense Demo
Demonstra autocompletar e tipos do editor.

### **tax-calculation.js** - Cálculo de Impostos 🧮
Demonstra o Motor de Cálculo de Tributos para operações com produtos:
- ✅ Listar códigos de operação e perfis fiscais disponíveis
- ✅ Enviar requisição de cálculo de impostos
- ✅ Inspecionar detalhamento por item (ICMS, PIS, COFINS, IPI, II)

```bash
node examples/tax-calculation.js
```

**Requer**: `NFE_TENANT_ID` no `.env.test` com o ID da subscription/conta.

---

## ✨ Novos na v5

Recursos introduzidos na v5 (validados contra a API ao vivo). Todos usam `NFE_API_KEY` e,
os company-scoped, `NFE_COMPANY_ID` de uma empresa apta a emitir.

### **rtc-invoices.js** - Reforma Tributária (RTC)
Emissão no leiaute RTC (IBS/CBS/IS) — `serviceInvoicesRtc` (polling) e `productInvoicesRtc` (webhook-driven). O RTC é selecionado pelo payload.

### **consumer-invoices.js** - NFC-e
Ciclo de vida da NFC-e (`consumerInvoices`): emissão webhook-driven, `list`/leituras **exigem `environment`** (`Production`/`Test`), downloads e inutilização.

### **municipal-taxes.js** - Inscrições Municipais
CRUD de inscrições municipais (`municipalTaxes`) — pré-requisito para NFS-e —, com `updatePrefecture` (PATCH) e `getSeries`.

### **certificates.js** - Certificados por thumbprint
Consulta/remoção de certificados por thumbprint (`certificates`), com variantes v1.

### **notifications.js** - Notificações
Notificações da empresa (`notifications`): listar, obter, remover, enviar e-mail.

### **account-webhooks.js** - Webhooks de Conta
Webhooks no nível da **conta** (`webhooks.*Account*`) + `fetchEventTypes()` (lista de eventos ao vivo).

```bash
node examples/rtc-invoices.js
node examples/consumer-invoices.js
node examples/municipal-taxes.js
node examples/certificates.js
node examples/notifications.js
node examples/account-webhooks.js
```

> Emissão contra a API real cria documentos de homologação (env `development`/`Test`). Ajuste os payloads ao seu caso antes de rodar.

---

## 📖 Ordem Recomendada de Execução

Se você é iniciante, recomendamos executar nesta ordem:

0. **🚨 PRIMEIRO**: `test-connection.js`
   - Verificar se tudo está configurado corretamente
   - Testar credenciais e conexão
   - Validar que o projeto foi buildado

1. **Segundo**: `real-world-list-invoices.js`
   - Ver o que já existe na sua conta
   - Familiarizar-se com a estrutura de dados
   - Não cria nada, apenas consulta

2. **Terceiro**: `real-world-manage-people.js`
   - Cadastrar clientes para usar nas notas fiscais
   - Evitar redigitar dados toda vez
   - Cria dados de teste

3. **Quarto**: `real-world-invoice.js`
   - Emitir sua primeira nota fiscal
   - Ver o fluxo completo funcionando
   - ⚠️ Cria nota fiscal real!

4. **Quinto**: `real-world-webhooks.js`
   - Configurar automação (quando tiver servidor)
   - Receber eventos em tempo real
   - Apenas demonstração (não cria webhook real)

---

## 🔍 Entendendo os Resultados

### Status de Nota Fiscal

As notas podem ter diferentes status:
- `issued` - Emitida com sucesso
- `processing` - Em processamento (assíncrono)
- `error` - Erro na emissão
- `cancelled` - Cancelada

### Processamento Assíncrono

Algumas prefeituras processam notas de forma assíncrona:
- Você recebe status HTTP 202 (Accepted)
- A nota entra em status `processing`
- Use `createAndWait()` para aguardar automaticamente
- Ou faça polling manual com `retrieve()`

### Arquivos Gerados

Após executar `real-world-invoice.js`, você encontrará:
- `nota-fiscal-XXXXX.pdf` - PDF da nota fiscal
- `nota-fiscal-XXXXX.xml` - XML da nota fiscal

---

## 🐛 Troubleshooting

### Erro: "NFE_API_KEY não encontrada"
✅ Verifique se o arquivo `.env.test` existe na raiz do projeto
✅ Verifique se a variável `NFE_API_KEY` está definida corretamente

### Erro: "AuthenticationError: Invalid API key"
✅ Verifique se copiou a chave corretamente do painel NFE.io
✅ Certifique-se de estar usando a chave do environment correto

### Erro: "Nenhuma empresa encontrada"
✅ Acesse o painel NFE.io e crie uma empresa
✅ Configure o certificado digital da empresa
✅ Aguarde aprovação cadastral (pode levar algumas horas)

### Erro ao emitir nota: "ValidationError"
✅ Verifique se todos os campos obrigatórios estão preenchidos
✅ Confira se o `cityServiceCode` é válido para sua cidade
✅ Certifique-se de que o CNPJ/CPF do tomador é válido

### Erro: "Cannot find module '../dist/index.js'"
✅ Execute `npm run build` antes de rodar os exemplos
✅ Verifique se a pasta `dist/` foi criada

---

## 💡 Dicas Pro

1. **Reutilize clientes cadastrados**
   - Cadastre clientes frequentes com `manage-people.js`
   - Use `findByTaxNumber()` ao emitir notas

2. **Use polling automático**
   - Prefira `createAndWait()` em vez de `create()`
   - Evita necessidade de polling manual

3. **Salve os arquivos**
   - PDFs e XMLs são salvos automaticamente
   - Organize em pastas por período

4. **Configure webhooks**
   - Receba notificações automáticas
   - Sincronize com seu sistema

5. **Trate erros apropriadamente**
   - Use `try/catch` com verificação de `statusCode`
   - Log detalhes para debugging

---

## 📚 Documentação Adicional

- [README Principal](../README.md)
- [Documentação da API](../docs/API.md)
- [Guia de Migração v2→v3](../MIGRATION.md)
- [Documentação Oficial NFE.io](https://nfe.io/docs/)

---

## 🤝 Precisa de Ajuda?

- 📧 Email: suporte@nfe.io
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues
- 📖 Docs: https://nfe.io/docs/

---

**Feito com ❤️ pela equipe NFE.io**
