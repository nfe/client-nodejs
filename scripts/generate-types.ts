#!/usr/bin/env tsx
/**
 * Generate TypeScript types from OpenAPI specifications
 *
 * This script orchestrates the type generation process:
 * 1. Discovers OpenAPI spec files in openapi/spec/
 * 2. Runs openapi-typescript for each spec
 * 3. Generates combined type index
 * 4. Validates output compiles
 *
 * Usage:
 *   npm run generate              # Generate all types
 *   npm run generate:watch        # Watch mode for development
 */

import { readdir, writeFile, mkdir, readFile } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import openapiTS, { astToString } from 'openapi-typescript';
import { createConfig } from '@redocly/openapi-core';

// ============================================================================
// Configuration
// ============================================================================

interface GeneratorConfig {
  specDir: string;
  outputDir: string;
  specs: SpecConfig[];
}

interface SpecConfig {
  inputPath: string;
  outputPath: string;
  namespace: string;
  name: string;
}

const config: Omit<GeneratorConfig, 'specs'> = {
  specDir: resolve(process.cwd(), 'openapi/spec'),
  outputDir: resolve(process.cwd(), 'src/generated'),
};

/**
 * Specs that are KNOWN to be skipped (legacy Swagger 2.0, hand-typed in
 * src/core/types.ts). A skip of one of these is expected and does NOT fail the
 * build. A skip of anything NOT on this list is an error (fail-loud) — see
 * the `sync-openapi-specs-from-docs` change (review finding B1). Keep this list
 * in sync with the hand-typed resources until those specs are converted to 3.x.
 */
const KNOWN_SKIPPED = new Set<string>([
  'consulta-cnpj',
  'consulta-cpf',
  'consulta-endereco',
  'consulta-nf-consumidor',
  'consulta-nf',
]);

// ============================================================================
// Main Generation Logic
// ============================================================================

async function main(): Promise<void> {
  console.log('🚀 Starting OpenAPI type generation...\n');

  try {
    // 1. Discover spec files
    console.log('📁 Discovering OpenAPI specs...');
    const specs = await discoverSpecs();
    console.log(`   Found ${specs.length} spec file(s)\n`);

    // 2. Ensure output directory exists
    await ensureOutputDirectory();

    // 3. Generate types for each spec
    console.log('⚙️  Generating TypeScript types...');
    const generatedSpecs: SpecConfig[] = [];
    const skipped: SpecConfig[] = [];
    for (const spec of specs) {
      const wasGenerated = await generateTypesForSpec(spec);
      if (wasGenerated) {
        generatedSpecs.push(spec);
      } else {
        skipped.push(spec);
      }
    }

    // 3b. Fail-loud BEFORE writing the index / success banner: an UNEXPECTED skip
    // (a spec not on the known-skipped allowlist) means types silently vanished.
    const unexpected = skipped.filter(s => !KNOWN_SKIPPED.has(s.name));
    if (skipped.length > 0) {
      const known = skipped.filter(s => KNOWN_SKIPPED.has(s.name)).map(s => s.name);
      if (known.length) console.log(`   ℹ️  Known-skipped (hand-typed): ${known.join(', ')}`);
    }
    if (unexpected.length > 0) {
      throw new Error(
        `Generation produced no output for ${unexpected.length} unexpected spec(s): ` +
          `${unexpected.map(s => s.name).join(', ')}. ` +
          `Convert to OpenAPI 3.x, or add to KNOWN_SKIPPED if intentionally hand-typed.`
      );
    }

    // 4. Create unified index
    console.log('\n📦 Creating unified index...');
    await createUnifiedIndex(generatedSpecs);

    console.log('\n✅ Type generation completed successfully!');
    console.log(
      `   Generated ${generatedSpecs.length} of ${specs.length} spec file(s)` +
        ` (${skipped.length} known-skipped)`
    );
    console.log(`   Output directory: ${config.outputDir}\n`);

  } catch (error) {
    console.error('\n❌ Type generation failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Discovery
// ============================================================================

/**
 * Discovers all OpenAPI spec files in the spec directory
 */
async function discoverSpecs(): Promise<SpecConfig[]> {
  const files = await readdir(config.specDir);

  const specFiles = files.filter(file =>
    file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
  );

  if (specFiles.length === 0) {
    throw new Error(`No OpenAPI specs found in ${config.specDir}`);
  }

  return specFiles.map(file => {
    const ext = file.endsWith('.yaml') ? '.yaml' : file.endsWith('.yml') ? '.yml' : '.json';
    const baseName = basename(file, ext);
    const namespace = toNamespace(baseName);

    return {
      inputPath: join(config.specDir, file),
      outputPath: join(config.outputDir, `${baseName}.ts`),
      namespace,
      name: baseName,
    };
  });
}

/**
 * Converts filename to namespace (e.g., nf-servico-v1 → NfServico)
 */
function toNamespace(filename: string): string {
  return filename
    .split('-')
    .map(part => part.replace(/v\d+/, '')) // Remove version numbers
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// ============================================================================
// Generation
// ============================================================================

/**
 * Ensures the output directory exists
 */
async function ensureOutputDirectory(): Promise<void> {
  if (!existsSync(config.outputDir)) {
    await mkdir(config.outputDir, { recursive: true });
    console.log(`   Created output directory: ${config.outputDir}`);
  }
}

/**
 * Generates TypeScript types for a single OpenAPI spec
 * Returns true if generated, false if skipped
 */
async function generateTypesForSpec(spec: SpecConfig): Promise<boolean> {
  console.log(`   • ${spec.name}...`);

  try {
    // Check if spec is Swagger 2.0 (not supported by openapi-typescript v6+)
    const specContent = await readFile(spec.inputPath, 'utf-8');
    if (specContent.includes('swagger: "2.0"') || specContent.includes("swagger: '2.0'")) {
      console.log(`     ⚠️  Skipped (Swagger 2.0 not supported by openapi-typescript v6+)`);
      console.log(`     💡 Consider converting to OpenAPI 3.0 for type generation`);
      return false;
    }

    // Generate types using openapi-typescript (v7+ returns AST)
    // Disable Redocly validation rules that openapi-typescript v6 tolerated
    // (some legacy NFE.io specs have duplicate operationIds and other minor issues)
    const redoclyConfig = await createConfig({
      rules: {
        'operation-operationId-unique': 'off',
        'operation-operationId': 'off',
        'no-identical-paths': 'off',
        'no-ambiguous-paths': 'off',
        'struct': 'off',
      },
    });
    const ast = await openapiTS(pathToFileURL(spec.inputPath), {
      immutable: true,
      redocly: redoclyConfig,
    });
    const output = astToString(ast);

    // Wrap output with metadata banner
    const wrappedOutput = wrapWithMetadata(output, spec);

    // Write to output file
    await writeFile(spec.outputPath, wrappedOutput, 'utf-8');

    console.log(`     ✓ Generated ${spec.outputPath}`);
    return true;

  } catch (error) {
    console.error(`     ✗ Failed to generate types for ${spec.name}:`, error);
    throw error;
  }
}

/**
 * Wraps generated output with metadata banner
 */
function wrapWithMetadata(output: string, spec: SpecConfig): string {
  const timestamp = new Date().toISOString();
  const banner = `/**
 * ⚠️  AUTO-GENERATED from ${basename(spec.inputPath)}
 *
 * Do not edit this file directly.
 *
 * To regenerate: npm run generate
 * Last generated: ${timestamp}
 * Generator: openapi-typescript
 */

`;

  return banner + output;
}

// ============================================================================
// Index Creation
// ============================================================================

/**
 * Creates unified index file with re-exports
 */
async function createUnifiedIndex(specs: SpecConfig[]): Promise<void> {
  const indexPath = join(config.outputDir, 'index.ts');

  const content = `/**
 * NFE.io SDK - Generated Types Index
 *
 * This file re-exports types from all OpenAPI specifications.
 * Types are namespaced by spec to avoid conflicts.
 *
 * @generated
 * Last updated: ${new Date().toISOString()}
 */

// ============================================================================
// Per-Spec Namespace Exports
// ============================================================================

${specs.map(spec =>
  `export * as ${spec.namespace} from './${spec.name}.js';`
).join('\n')}

// ============================================================================
// Convenience Type Aliases
// ============================================================================

${generateTypeAliases(specs)}

// ============================================================================
// Backward Compatibility
// ============================================================================

// Main spec (nf-servico) types available at root level for convenience
// This maintains compatibility with existing code
${specs.find(s => s.name.includes('servico'))
  ? `export * from './nf-servico-v1.js';`
  : '// No main spec found'}
`;

  await writeFile(indexPath, content, 'utf-8');
  console.log(`   ✓ Created unified index: ${indexPath}`);
}

/**
 * Generates convenience type aliases for common types
 */
function generateTypeAliases(specs: SpecConfig[]): string {
  // Find the main spec (nf-servico) to use as canonical source
  const mainSpec = specs.find(s => s.name.includes('servico'));

  if (!mainSpec) {
    return '// No main spec found for type aliases';
  }

  // The public domain types (ServiceInvoice, Company, LegalPerson, NaturalPerson)
  // live in src/core/types.ts — that is the public surface (the barrel re-exports
  // from there, not from this generated index). We deliberately do NOT emit
  // placeholder `{ [key: string]: unknown }` interfaces here: they were dead code
  // that masked the real types and invited drift. (sync-openapi-specs-from-docs, 0B)
  return `// Domain types are defined in src/core/types.ts (the public surface).
// Main spec namespace: ${mainSpec.namespace}. Use namespaced generated types for raw operations/paths.`;
}

// ============================================================================
// Execution
// ============================================================================

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
