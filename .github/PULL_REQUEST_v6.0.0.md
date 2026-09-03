# Release v6.0.0 — correção de contrato provada contra a API real

> **Este arquivo é rascunho da descrição do PR.** Apagar depois de abrir o PR.
>
> `gh pr create --base master --head release/v6.0.0 --title "Release v6.0.0 — correção de contrato provada contra a API real" --body-file .github/PULL_REQUEST_v6.0.0.md`

## O que é

Major de **correção de contrato**. Nenhuma funcionalidade nova: são bugs provados por sonda
ao vivo contra a API real entre 01 e 03/09, a maioria em métodos que **nunca puderam
funcionar**.

Em nenhum deles a especificação era a culpada — o SDK é que estava errado. Evidência
versionada em `tests/fixtures/live-contracts/`, com dado sensível redigido.

## ⚠️ Breaking changes

Medidas comparando o `dist/index.d.ts` desta branch com o construído a partir da v5.2.0
publicada — não estimadas.

| superfície | antes | agora |
|---|---|---|
| `serviceInvoices.downloadPdf/downloadXml` | `invoiceId?: string` | `invoiceId: string` |
| `inboundProductInvoices.getXml/getPdf/getEventXml` | `Promise<string>` | `Promise<InboundFileResource>` |
| `transportationInvoices.downloadXml/downloadEventXml` | `Promise<string>` | `Promise<InboundFileResource>` |
| `consumerInvoices.downloadPdf/Xml/RejectionXml` | `Buffer` / `NfeFileResource` | `ConsumerInvoiceFileResource` |
| `consumerInvoices.getItems/getEvents` | `environment?` | `options?`, retorno próprio |
| `consumerInvoices.cancel` | devolvia a nota | `ConsumerInvoiceCancellationResponse` |
| `companies.getCertificateStatus` | tipo inline | `CertificateStatusSummary` |
| `PACKAGE_NAME` | `'@nfe-io/sdk'` | `'nfe-io'` |
| wiring de credencial | `403` na chamada | `ConfigurationError` na hora |

**Zero métodos removidos.** Só uma quebra interrompe compilação de código que funcionava:
o `invoiceId` obrigatório. As outras oito são em superfícies que já estavam quebradas —
métodos que só respondiam 404, retornos que vinham `undefined`, tipos que mentiam sobre o
que continham.

Roteiro completo em [`MIGRATION.md`](../MIGRATION.md#v5--v6).

## Os bugs, por ordem de gravidade

**Nove recursos fiscais usavam a credencial errada.** O cliente de `api.nfse.io` resolvia a
chave **de dados** num host **fiscal**, que responde `403`. Só funcionavam por acidente, via
o fallback `dataApiKey → apiKey`. Quem configurava `dataApiKey` — o que a documentação
recomenda — tomava `403`.

**`companies.getCertificateStatus()` lia uma forma que a API nunca devolveu.** Retornava
`{hasCertificate: undefined}` para toda empresa, e derrubava em cascata outros três métodos.
O mesmo bug está no `client-php` e no `client-ruby`, por cópia — há change aberta nos dois.

**`healthCheck()` respondia `error` sempre.** Enviava `pageCount: 1`, que a API recusa com
`400 "pageCount must be between 1 and 50"` — o limite inferior do servidor está um a mais do
que a própria mensagem diz. O método existe para dizer se a integração está de pé.

**Downloads devolviam objeto tipado como texto.** As rotas de entrada respondem
`{ publicTemporaryUri }`; binário nunca trafegou nelas.

**O erro da API não chegava ao chamador.** `extractErrorMessage` lia dois dos quatro
envelopes que a plataforma usa. Nos outros dois o chamador recebia `HTTP 400 error` — o
status que já tinha. Foi assim que `The File field is required.` ficou invisível enquanto o
upload de certificado não funcionava.

**Toda requisição mentia sobre a versão.** O User-Agent saía `@nfe-io/sdk@3.0.0` — pacote
inexistente, versão três majors atrás. **93.995 requisições em 30 dias**, e nenhuma
informação de versão chegando à plataforma.

## O que ficou melhor além das correções

- **O portão de publicação passou a poder reprovar.** `publish.yml` tinha
  `continue-on-error: true` no passo de testes, com justificativa escrita que era falsa. Os
  três bugs corrigidos em 01/09 saíram por esse portão.
- **A suíte de integração voltou a rodar.** Nada carregava o `.env`, então ela pulava
  sempre. Execução local foi de **742 para 813 testes**; quatro assertions apodrecidas
  apareceram e foram corrigidas.
- **`validate:spec` detecta drift entre cópias da mesma seção** — 30 dos 131 endpoints são
  declarados em mais de uma spec e as cópias divergiram.
- **A tag da release e o `package.json` precisam concordar** antes de publicar.
- **Duas guardas novas**: versão fixada em literal e documentação citando método inexistente
  passam a quebrar a suíte. Ambas verificadas por mutação.

## Correções de registro

Dois métodos que o diagnóstico anterior dava como quebrados **não estavam** — a amostra é
que era a exceção:

- `productInvoiceQuery.downloadPdf` devolve `200` e `%PDF-1.4` com chave real. O `406`
  medido antes vinha de chave inexistente.
- `legalPeople`/`naturalPeople` (14 métodos) respondem `200`. O `400` vinha de empresa com
  id de 32 caracteres; a rota aceita só `ObjectId` de 24 hex — limite do servidor.

## Upstream

Sete issues abertas em `nfe/docs` a partir desta rodada: #335, #336, #337, #338, #343
(comentada), #345, #346, #347, #348.

## Verificação

```
typecheck   limpo
lint        0 erros (32 warnings pre-existentes de `any`)
test:types  18/18, no type errors
build       ok, dist reporta nfe-io@6.0.0
suite CI    776 passed | 54 skipped
suite local 813 passed | 7 skipped
portão      tag v6.0.0 passa; v5.2.0 reprova
```

## Depois do merge

1. Criar a release **`v6.0.0`** no GitHub — é o que dispara o `publish.yml`.
2. O portão confere tag × `package.json`, roda testes/lint/typecheck/`test:types`/build,
   verifica os artefatos e publica com provenance.
3. **`nfeio-docs` precisa de PR próprio**: a página pública
   `docs/desenvolvedores/bibliotecas/nodejs/multi-host-routing.md` tem a mesma tabela errada
   de credencial que este PR corrige aqui.
4. Apagar este arquivo (`.github/PULL_REQUEST_v6.0.0.md`).
