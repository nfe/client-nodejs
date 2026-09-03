# Fixtures de contrato ao vivo

Capturados em 2026-09-01 pelo change `probe-live-api-contracts`.

**Envelope real, corpo sintético.** Status, `content-type`, `Location` e a FORMA do corpo
vêm de respostas reais da API. Os valores dentro do corpo são fabricados: nenhum CNPJ, CPF,
chave de acesso, id de empresa, nome de contribuinte ou URL pré-assinada real entra aqui.

A evidência crua (com dado real) vive fora deste repositório, no vault:
`SDKs/Node/probe-09-01-2026/`.

Consumidos pelos mocks de `fix-consumer-invoices-contract` e `fix-binary-downloads-inbound`.
