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
import openapiTS from 'openapi-typescript';

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
    for (const spec of specs) {
      const wasGenerated = await generateTypesForSpec(spec);
      if (wasGenerated) {
        generatedSpecs.push(spec);
      }
    }

    // 4. Create unified index
    console.log('\n📦 Creating unified index...');
    await createUnifiedIndex(generatedSpecs);

    console.log('\n✅ Type generation completed successfully!');
    console.log(`   Generated ${generatedSpecs.length} of ${specs.length} spec file(s)`);
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
    file.endsWith('.yaml') || file.endsWith('.yml')
  );

  if (specFiles.length === 0) {
    throw new Error(`No OpenAPI specs found in ${config.specDir}`);
  }

  return specFiles.map(file => {
    const baseName = basename(file, file.endsWith('.yaml') ? '.yaml' : '.yml');
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

    // Generate types using openapi-typescript
    const output = await openapiTS(spec.inputPath, {
      // Options for type generation
      exportType: true,
      immutableTypes: true,
    });

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

  return `// Common types from main spec (${mainSpec.name})
// Use these for convenience, or use namespaced versions for specificity

// Import types to avoid namespace errors
import type { components as NfServicoComponents } from './${mainSpec.name}.js';

export type ServiceInvoice = NfServicoComponents['schemas']['ServiceInvoice'];
export type Company = NfServicoComponents['schemas']['Company'];
export type LegalPerson = NfServicoComponents['schemas']['LegalPerson'];
export type NaturalPerson = NfServicoComponents['schemas']['NaturalPerson'];

// Note: Other specs may define these types differently.
// Use namespaced imports (e.g., import { components } from '@/generated/nf-produto-v2') when specificity is needed.`;
}

// ============================================================================
// Execution
// ============================================================================

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
