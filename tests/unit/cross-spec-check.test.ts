/**
 * Check de duplicação cross-spec.
 *
 * As fixtures aqui são mínimas de propósito: cada uma isola UMA classe de
 * divergência. O caso do 5.3 (diferença só de forma) é o que importa mais — foi
 * ele que invalidou as três primeiras estratégias de comparação testadas no
 * design, todas as quais marcavam 100% dos paths como divergentes.
 */

import { describe, it, expect } from 'vitest';
import {
  analyze,
  classify,
  normalizePath,
  operationKey,
  type Sources,
} from '../../scripts/cross-spec-check.js';

/** Spec mínima com um GET cuja resposta 200 tem as propriedades dadas. */
function spec(properties: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    openapi: '3.0.0',
    paths: {
      '/v2/things/{thing_id}': {
        get: {
          ...extra,
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: { type: 'object', properties },
                },
              },
            },
          },
        },
      },
    },
  };
}

const SOURCES: Sources = {
  sharedSections: {
    G: {
      canonical: 'canon.yaml',
      duplicatedIn: ['copy.yaml'],
      paths: ['GET /v2/things/{}'],
    },
  },
};

function run(canon: unknown, copy: unknown, sources: Sources = SOURCES) {
  return analyze({
    specs: new Map<string, unknown>([
      ['canon.yaml', canon],
      ['copy.yaml', copy],
    ]),
    sources,
  });
}

describe('normalização de path', () => {
  it('colapsa params nomeados e estilo dois-pontos na mesma forma', () => {
    expect(normalizePath('/v2/companies/{companyId}')).toBe('/v2/companies/{}');
    expect(normalizePath('/v2/companies/:companyId')).toBe('/v2/companies/{}');
  });

  it('ignora case e barra final', () => {
    expect(normalizePath('/v2/Webhooks/EventTypes/')).toBe('/v2/webhooks/eventtypes');
  });

  it('compõe a chave com o método e o basePath', () => {
    expect(operationKey('get', '/companies', '/v1')).toBe('GET /v1/companies');
  });
});

describe('classificação de divergência', () => {
  it('tipo diferente é type-mismatch', () => {
    expect(classify({ type: 'string', enum: undefined }, { type: 'integer', enum: undefined })).toBe(
      'type-mismatch'
    );
  });

  it('enum da cópia contido no da canônica é defasagem', () => {
    expect(classify({ type: 'string', enum: ['a', 'b', 'c'] }, { type: 'string', enum: ['a', 'b'] })).toBe(
      'enum-subset'
    );
  });

  it('enum com valor que a canônica não tem é contradição', () => {
    expect(classify({ type: 'string', enum: ['A', 'B'] }, { type: 'string', enum: ['a', 'b'] })).toBe(
      'enum-mismatch'
    );
  });

  it('iguais não divergem', () => {
    expect(classify({ type: 'string', enum: ['a'] }, { type: 'string', enum: ['a'] })).toBeNull();
  });
});

describe('análise cross-spec', () => {
  it('5.1 drift novo fora da baseline é reportado como erro', async () => {
    const report = await run(
      spec({ contentType: { type: 'string', enum: ['json'] } }),
      spec({ contentType: { type: 'integer', enum: [0, 1] } })
    );

    expect(report.divergences).toHaveLength(1);
    expect(report.divergences[0]).toMatchObject({
      group: 'G',
      path: 'GET /v2/things/{}',
      field: 'res.contentType',
      class: 'type-mismatch',
      canonicalSpec: 'canon.yaml',
      duplicateSpec: 'copy.yaml',
    });
    expect(report.divergences[0]!.canonicalValue).toContain('string');
    expect(report.divergences[0]!.duplicateValue).toContain('integer');
  });

  it('5.2a cópias iguais não geram achado', async () => {
    const fields = { name: { type: 'string' }, size: { type: 'integer' } };
    const report = await run(spec(fields), spec(fields));

    expect(report.divergences).toHaveLength(0);
    expect(report.agreedFields['G']).toBe(2);
  });

  it('5.2b enum defasado é aviso, não erro', async () => {
    const report = await run(
      spec({ status: { type: 'string', enum: ['Active', 'Inactive', 'None'] } }),
      spec({ status: { type: 'string', enum: ['Active', 'None'] } })
    );

    expect(report.divergences).toHaveLength(1);
    expect(report.divergences[0]!.class).toBe('enum-subset');
  });

  it('5.3 diferença só de forma não gera achado', async () => {
    // Mesmo contrato, três formas diferentes de escrever: $ref × inline,
    // operationId presente × ausente, description divergente.
    const canon = {
      openapi: '3.0.0',
      components: { schemas: { Thing: { type: 'object', properties: { id: { type: 'string' } } } } },
      paths: {
        '/v2/things/{thing_id}': {
          get: {
            description: 'Uma descrição',
            responses: {
              '200': {
                description: 'ok',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Thing' } } },
              },
            },
          },
        },
      },
    };
    const copy = {
      openapi: '3.0.0',
      paths: {
        '/v2/things/:thingId': {
          get: {
            operationId: 'Things_get',
            description: 'Outra descrição completamente diferente',
            responses: {
              '200': {
                description: 'sucesso',
                content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } },
              },
            },
          },
        },
      },
    };

    const report = await run(canon, copy);
    expect(report.divergences).toHaveLength(0);
    expect(report.agreedFields['G']).toBe(1);
  });

  it('campo declarado só de um lado não é divergência', async () => {
    const report = await run(
      spec({ id: { type: 'string' }, search: { type: 'string' } }),
      spec({ id: { type: 'string' } })
    );

    expect(report.divergences).toHaveLength(0);
    expect(report.agreedFields['G']).toBe(1);
  });

  it('path compartilhado não declarado é erro de configuração', async () => {
    const report = await run(spec({ id: { type: 'string' } }), spec({ id: { type: 'string' } }), {
      sharedSections: {},
    });

    expect(report.undeclared).toHaveLength(1);
    expect(report.undeclared[0]).toMatchObject({
      path: 'GET /v2/things/{}',
      specs: ['canon.yaml', 'copy.yaml'],
    });
  });

  it('overload declarado não vira achado de duplicação', async () => {
    const report = await run(spec({ id: { type: 'string' } }), spec({ id: { type: 'integer' } }), {
      sharedSections: {},
      ignoredOverloads: { paths: [{ path: 'GET /v2/things/{}', specs: ['canon.yaml', 'copy.yaml'] }] },
    });

    expect(report.undeclared).toHaveLength(0);
    expect(report.divergences).toHaveLength(0);
  });
});

describe('baseline', () => {
  const divergent = () =>
    run(
      spec({ contentType: { type: 'string', enum: ['json'] } }),
      spec({ contentType: { type: 'integer', enum: [0, 1] } }),
      {
        ...SOURCES,
        knownDivergences: [
          {
            group: 'G',
            class: 'type-mismatch',
            fields: ['contentType'],
            reason: 'defeito conhecido de serialização',
            upstream: 'vault item 2',
          },
        ],
      }
    );

  it('divergência declarada sai dos erros e vira informativo', async () => {
    const report = await divergent();

    expect(report.divergences).toHaveLength(0);
    expect(report.baselined).toHaveLength(1);
    expect(report.baselined[0]!.field).toBe('res.contentType');
    expect(report.staleBaseline).toHaveLength(0);
  });

  it('drift novo continua falhando mesmo com baseline no mesmo path', async () => {
    const report = await run(
      spec({
        contentType: { type: 'string', enum: ['json'] },
        status: { type: 'string', enum: ['Active'] },
      }),
      spec({
        contentType: { type: 'integer', enum: [0, 1] },
        status: { type: 'integer', enum: [0, 1] },
      }),
      {
        ...SOURCES,
        knownDivergences: [
          {
            group: 'G',
            class: 'type-mismatch',
            fields: ['contentType'],
            reason: 'declarado',
            upstream: 'vault',
          },
        ],
      }
    );

    expect(report.baselined).toHaveLength(1);
    expect(report.divergences).toHaveLength(1);
    expect(report.divergences[0]!.field).toBe('res.status');
  });

  it('4.3 baseline que não reproduz mais pede remoção', async () => {
    const identical = { contentType: { type: 'string', enum: ['json'] } };
    const report = await run(spec(identical), spec(identical), {
      ...SOURCES,
      knownDivergences: [
        {
          group: 'G',
          class: 'type-mismatch',
          fields: ['contentType'],
          reason: 'já corrigido upstream',
          upstream: 'vault item 2',
        },
      ],
    });

    expect(report.divergences).toHaveLength(0);
    expect(report.staleBaseline).toHaveLength(1);
    expect(report.staleBaseline[0]!.fields).toEqual(['contentType']);
  });
});
