#!/usr/bin/env tsx
/**
 * Check de duplicação cross-spec.
 *
 * Várias seções (companies, certificates, statetaxes, webhooks) são declaradas em
 * mais de uma spec da plataforma, e as cópias divergem. O `SOURCES.json` declara a
 * fonte canônica de cada grupo; este check compara as cópias contra ela e falha
 * quando aparece divergência nova.
 *
 * A comparação é CAMPO A CAMPO (`caminho.do.campo -> tipo/enum`), não operação a
 * operação. Medido em 2026-09-01 sobre as specs reais: comparar a operação inteira,
 * mesmo descontando prosa, marca 100% dos paths dos grupos A/B como divergentes —
 * ruído de forma (`content: {}` versus ausente, schema inline versus `$ref`, ordem
 * de chave). Campo a campo, o grupo C isola exatamente as 24 contradições reais de
 * `contentType`/`status` sem um único falso positivo.
 */

import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

const SPEC_DIR = resolve(process.cwd(), 'openapi/spec');
const SOURCES_FILE = 'SOURCES.json';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head'] as const;

/** Campos de prosa: nunca são contrato, sempre diferem entre cópias. */
const PROSE_KEYS = new Set([
  'description', 'summary', 'example', 'examples', 'tags',
  'operationId', 'title', 'externalDocs', 'deprecated',
]);

const MAX_DEPTH = 6;

// ============================================================================
// Tipos
// ============================================================================

export type DivergenceClass =
  | 'type-mismatch'
  | 'enum-mismatch'
  | 'enum-subset'
  | 'field-only-in';

export interface Divergence {
  group: string;
  path: string;
  field: string;
  canonicalSpec: string;
  duplicateSpec: string;
  class: DivergenceClass;
  canonicalValue: string;
  duplicateValue: string;
}

export interface FieldShape {
  type: string | undefined;
  enum: string[] | undefined;
}

export interface SharedSection {
  canonical: string;
  duplicatedIn: string[];
  paths: string[];
  rationale?: string;
}

export interface KnownDivergence {
  group: string;
  class: DivergenceClass;
  fields: string[];
  reason: string;
  upstream: string;
}

export interface Sources {
  sharedSections?: Record<string, SharedSection | string>;
  ignoredOverloads?: { paths: Array<{ path: string; specs: string[] }> };
  knownDivergences?: KnownDivergence[];
}

export interface CrossSpecReport {
  divergences: Divergence[];
  baselined: Divergence[];
  undeclared: Array<{ path: string; specs: string[] }>;
  staleBaseline: KnownDivergence[];
  agreedFields: Record<string, number>;
}

// ============================================================================
// Normalização
// ============================================================================

/** `/v2/companies/{company_id}` e `/v2/companies/:companyId` -> `/v2/companies/{}` */
export function normalizePath(path: string): string {
  return path
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '{}')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function operationKey(method: string, path: string, basePath = ''): string {
  return `${method.toUpperCase()} ${normalizePath(basePath + path)}`;
}

// ============================================================================
// Achatamento de schema
// ============================================================================

function deref(spec: unknown, node: unknown, hops = 0): Record<string, unknown> {
  let current = node;
  let n = hops;
  while (
    current && typeof current === 'object' && !Array.isArray(current) &&
    typeof (current as Record<string, unknown>)['$ref'] === 'string' && n < 10
  ) {
    const ref = (current as Record<string, unknown>)['$ref'] as string;
    if (!ref.startsWith('#/')) break;
    let cursor: unknown = spec;
    for (const part of ref.slice(2).split('/')) {
      cursor =
        cursor && typeof cursor === 'object'
          ? (cursor as Record<string, unknown>)[part.replace(/~1/g, '/').replace(/~0/g, '~')]
          : undefined;
    }
    if (cursor === undefined) break;
    current = cursor;
    n++;
  }
  return current && typeof current === 'object' && !Array.isArray(current)
    ? (current as Record<string, unknown>)
    : {};
}

/** Achata um schema em `caminho -> (type, enum)`. Prosa e forma ficam de fora. */
function flattenSchema(
  spec: unknown,
  schema: unknown,
  prefix: string,
  out: Map<string, FieldShape>,
  depth = 0
): Map<string, FieldShape> {
  if (depth > MAX_DEPTH) return out;
  const s = deref(spec, schema, 0);

  if (s['type'] === 'array') {
    return flattenSchema(spec, s['items'], `${prefix}[]`, out, depth + 1);
  }

  const props = s['properties'];
  if (props && typeof props === 'object') {
    for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
      if (PROSE_KEYS.has(key)) continue;
      flattenSchema(spec, value, prefix ? `${prefix}.${key}` : key, out, depth + 1);
    }
    return out;
  }

  if (prefix) {
    const enumValues = Array.isArray(s['enum'])
      ? (s['enum'] as unknown[]).map(String).sort()
      : undefined;
    out.set(prefix, { type: typeof s['type'] === 'string' ? s['type'] : undefined, enum: enumValues });
  }
  return out;
}

/** Superfície que um cliente amarra: params + request body + respostas 2xx. */
export function operationFields(spec: unknown, operation: Record<string, unknown>): Map<string, FieldShape> {
  const out = new Map<string, FieldShape>();

  for (const param of (operation['parameters'] as unknown[]) ?? []) {
    if (!param || typeof param !== 'object') continue;
    const p = param as Record<string, unknown>;
    const schema = deref(spec, p['schema'], 0);
    const enumValues = Array.isArray(schema['enum'])
      ? (schema['enum'] as unknown[]).map(String).sort()
      : undefined;
    out.set(`param.${String(p['name'])}`, {
      type: typeof schema['type'] === 'string' ? schema['type'] : undefined,
      enum: enumValues,
    });
  }

  const body = deref(spec, operation['requestBody'], 0);
  for (const media of Object.values((body['content'] as Record<string, unknown>) ?? {})) {
    if (media && typeof media === 'object') {
      flattenSchema(spec, (media as Record<string, unknown>)['schema'], 'req', out);
    }
  }

  for (const [code, response] of Object.entries((operation['responses'] as Record<string, unknown>) ?? {})) {
    if (!code.startsWith('2')) continue;
    const r = deref(spec, response, 0);
    for (const media of Object.values((r['content'] as Record<string, unknown>) ?? {})) {
      if (media && typeof media === 'object') {
        flattenSchema(spec, (media as Record<string, unknown>)['schema'], 'res', out);
      }
    }
  }

  return out;
}

// ============================================================================
// Classificação
// ============================================================================

function describe(shape: FieldShape): string {
  return shape.enum ? `${shape.type ?? '?'} [${shape.enum.join(', ')}]` : String(shape.type ?? '?');
}

export function classify(canonical: FieldShape, duplicate: FieldShape): DivergenceClass | null {
  if (canonical.type !== duplicate.type) return 'type-mismatch';

  const a = canonical.enum;
  const b = duplicate.enum;
  if (!a && !b) return null;
  if (!a || !b) return 'enum-mismatch';
  if (a.length === b.length && a.every((v, i) => v === b[i])) return null;

  // Cópia estritamente contida na canônica: defasagem, não contradição.
  const canonicalSet = new Set(a);
  if (b.every(v => canonicalSet.has(v))) return 'enum-subset';
  return 'enum-mismatch';
}

// ============================================================================
// Análise
// ============================================================================

export async function loadSpecs(): Promise<Map<string, unknown>> {
  const files = (await readdir(SPEC_DIR)).filter(
    f => f !== SOURCES_FILE && (f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'))
  );
  const specs = new Map<string, unknown>();
  for (const file of files) {
    const raw = await readFile(join(SPEC_DIR, file), 'utf-8');
    try {
      specs.set(file, parseYaml(raw)); // parseYaml também lê JSON
    } catch {
      // Spec malformada já é reportada pelo validador por arquivo; aqui só pulamos.
    }
  }
  return specs;
}

export async function loadSources(): Promise<Sources> {
  return JSON.parse(await readFile(join(SPEC_DIR, SOURCES_FILE), 'utf-8')) as Sources;
}

function indexOperations(specs: Map<string, unknown>): Map<string, Map<string, Record<string, unknown>>> {
  const index = new Map<string, Map<string, Record<string, unknown>>>();
  for (const [file, spec] of specs) {
    if (!spec || typeof spec !== 'object') continue;
    const s = spec as Record<string, unknown>;
    const basePath = typeof s['basePath'] === 'string' ? s['basePath'] : '';
    for (const [path, item] of Object.entries((s['paths'] as Record<string, unknown>) ?? {})) {
      if (!item || typeof item !== 'object') continue;
      for (const [method, operation] of Object.entries(item as Record<string, unknown>)) {
        if (!HTTP_METHODS.includes(method.toLowerCase() as (typeof HTTP_METHODS)[number])) continue;
        const key = operationKey(method, path, basePath);
        if (!index.has(key)) index.set(key, new Map());
        index.get(key)!.set(file, operation as Record<string, unknown>);
      }
    }
  }
  return index;
}

/**
 * @param input Specs e SOURCES já carregados. Omitido, lê de `openapi/spec/`.
 *              Os testes injetam fixtures por aqui.
 */
export async function analyze(input?: {
  specs: Map<string, unknown>;
  sources: Sources;
}): Promise<CrossSpecReport> {
  const specs = input?.specs ?? (await loadSpecs());
  const sources = input?.sources ?? (await loadSources());
  const index = indexOperations(specs);

  const sections = Object.entries(sources.sharedSections ?? {}).filter(
    (entry): entry is [string, SharedSection] => typeof entry[1] === 'object' && entry[1] !== null
  );
  const overloads = new Set((sources.ignoredOverloads?.paths ?? []).map(p => p.path));
  const known = sources.knownDivergences ?? [];

  const declared = new Set<string>(overloads);
  for (const [, section] of sections) for (const p of section.paths) declared.add(p);

  const divergences: Divergence[] = [];
  const baselined: Divergence[] = [];
  const agreedFields: Record<string, number> = {};
  const seenBaseline = new Set<string>();

  for (const [groupName, section] of sections) {
    let agreed = 0;
    for (const opKey of section.paths) {
      const bySpec = index.get(opKey);
      if (!bySpec) continue;
      const canonicalOp = bySpec.get(section.canonical);
      if (!canonicalOp) continue;
      const canonicalSpec = specs.get(section.canonical);
      const canonicalFields = operationFields(canonicalSpec, canonicalOp);

      for (const duplicateFile of section.duplicatedIn) {
        const duplicateOp = bySpec.get(duplicateFile);
        if (!duplicateOp) continue;
        const duplicateFields = operationFields(specs.get(duplicateFile), duplicateOp);

        for (const [field, canonicalShape] of canonicalFields) {
          const duplicateShape = duplicateFields.get(field);
          if (!duplicateShape) continue;
          const klass = classify(canonicalShape, duplicateShape);
          if (!klass) {
            agreed++;
            continue;
          }
          const item: Divergence = {
            group: groupName,
            path: opKey,
            field,
            canonicalSpec: section.canonical,
            duplicateSpec: duplicateFile,
            class: klass,
            canonicalValue: describe(canonicalShape),
            duplicateValue: describe(duplicateShape),
          };
          const match = known.find(
            k => k.group === groupName && k.class === klass && k.fields.some(f => field === f || field.endsWith(`.${f}`))
          );
          if (match) {
            baselined.push(item);
            seenBaseline.add(`${match.group}|${match.class}|${match.fields.join(',')}`);
          } else {
            divergences.push(item);
          }
        }
      }
    }
    agreedFields[groupName] = agreed;
  }

  const undeclared: Array<{ path: string; specs: string[] }> = [];
  for (const [key, bySpec] of index) {
    if (bySpec.size > 1 && !declared.has(key)) {
      undeclared.push({ path: key, specs: [...bySpec.keys()].sort() });
    }
  }

  const staleBaseline = known.filter(
    k => !seenBaseline.has(`${k.group}|${k.class}|${k.fields.join(',')}`)
  );

  return { divergences, baselined, undeclared, staleBaseline, agreedFields };
}
