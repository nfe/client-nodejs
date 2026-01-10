#!/usr/bin/env tsx
/**
 * Validate OpenAPI specifications
 *
 * This script validates OpenAPI 3.0 specifications before type generation:
 * 1. Checks OpenAPI 3.0 schema compliance
 * 2. Validates required fields
 * 3. Warns about deprecated features
 * 4. Reports clear error messages
 *
 * Usage:
 *   npm run validate:spec           # Validate all specs
 *   npm run validate:spec --strict  # Fail on warnings
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

// ============================================================================
// Configuration
// ============================================================================

const SPEC_DIR = resolve(process.cwd(), 'openapi/spec');
const STRICT_MODE = process.argv.includes('--strict');

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  message: string;
  path?: string;
  line?: number;
}

interface ValidationWarning {
  message: string;
  path?: string;
  suggestion?: string;
}

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;  // Swagger 2.0
  info?: {
    title?: string;
    version?: string;
  };
  servers?: Array<{ url: string }>;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
  definitions?: Record<string, any>;  // Swagger 2.0
}

// ============================================================================
// Main Validation Logic
// ============================================================================

async function main(): Promise<void> {
  console.log('🔍 Validating OpenAPI specifications...\n');

  try {
    const files = await discoverSpecs();
    console.log(`Found ${files.length} spec file(s) to validate\n`);

    const results: ValidationResult[] = [];

    for (const file of files) {
      const result = await validateSpec(file);
      results.push(result);
      printResult(result);
    }

    printSummary(results);

    // Exit with error if any validation failed
    const hasErrors = results.some(r => !r.valid);
    const hasWarnings = results.some(r => r.warnings.length > 0);

    if (hasErrors || (STRICT_MODE && hasWarnings)) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Discovery
// ============================================================================

async function discoverSpecs(): Promise<string[]> {
  const files = await readdir(SPEC_DIR);
  return files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
}

// ============================================================================
// Validation
// ============================================================================

async function validateSpec(filename: string): Promise<ValidationResult> {
  const filePath = join(SPEC_DIR, filename);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Read and parse YAML
    const content = await readFile(filePath, 'utf-8');
    const spec: OpenAPISpec = parseYaml(content);

    // Validate OpenAPI version
    if (!spec.openapi && !spec.swagger) {
      errors.push({
        message: 'Missing required field: openapi or swagger',
        path: 'root',
      });
    } else if (spec.swagger && !spec.swagger.startsWith('2.0')) {
      errors.push({
        message: `Invalid Swagger version: ${spec.swagger} (expected 2.0)`,
        path: 'swagger',
      });
    } else if (spec.openapi && !spec.openapi.startsWith('3.0')) {
      errors.push({
        message: `Invalid OpenAPI version: ${spec.openapi} (expected 3.0.x)`,
        path: 'openapi',
      });
    } else if (spec.swagger) {
      warnings.push({
        message: `Swagger 2.0 spec detected (${spec.swagger})`,
        path: 'swagger',
        suggestion: 'Consider converting to OpenAPI 3.0 for better tooling support',
      });
    }

    // Validate info object
    if (!spec.info) {
      errors.push({
        message: 'Missing required field: info',
        path: 'root',
      });
    } else {
      if (!spec.info.title) {
        errors.push({
          message: 'Missing required field: info.title',
          path: 'info',
        });
      }
      if (!spec.info.version) {
        errors.push({
          message: 'Missing required field: info.version',
          path: 'info',
        });
      }
    }

    // Validate servers
    if (!spec.servers || spec.servers.length === 0) {
      warnings.push({
        message: 'No servers defined',
        path: 'servers',
        suggestion: 'Consider adding at least one server URL',
      });
    }

    // Validate paths
    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push({
        message: 'No paths defined',
        path: 'paths',
      });
    } else {
      // Validate operations have operationId
      for (const [pathName, pathItem] of Object.entries(spec.paths)) {
        const operations = ['get', 'post', 'put', 'delete', 'patch'];

        for (const op of operations) {
          if (pathItem[op]) {
            if (!pathItem[op].operationId) {
              warnings.push({
                message: `Operation ${op.toUpperCase()} ${pathName} missing operationId`,
                path: `paths.${pathName}.${op}`,
                suggestion: 'Add operationId for better code generation',
              });
            }
          }
        }
      }
    }

    // Check for deprecated features
    if (spec.components?.schemas) {
      for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
        // Check for deprecated type: file
        if (schema.type === 'file') {
          warnings.push({
            message: `Schema ${schemaName} uses deprecated type: file`,
            path: `components.schemas.${schemaName}`,
            suggestion: 'Use type: string with format: binary for file uploads',
          });
        }
      }
    }

    return {
      file: filename,
      valid: errors.length === 0,
      errors,
      warnings,
    };

  } catch (error) {
    return {
      file: filename,
      valid: false,
      errors: [{
        message: `Failed to parse spec: ${error instanceof Error ? error.message : String(error)}`,
      }],
      warnings: [],
    };
  }
}

// ============================================================================
// Output
// ============================================================================

function printResult(result: ValidationResult): void {
  const icon = result.valid ? '✓' : '✗';
  const status = result.valid ? 'valid' : 'INVALID';

  let output = `${icon} ${result.file}`;

  if (result.errors.length > 0) {
    output += ` - ${result.errors.length} error(s)`;
  }

  if (result.warnings.length > 0) {
    output += ` - ${result.warnings.length} warning(s)`;
  }

  console.log(output);

  // Print errors
  if (result.errors.length > 0) {
    console.log(`  Errors:`);
    for (const error of result.errors) {
      console.log(`    ❌ ${error.message}`);
      if (error.path) {
        console.log(`       at: ${error.path}`);
      }
    }
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log(`  Warnings:`);
    for (const warning of result.warnings) {
      console.log(`    ⚠️  ${warning.message}`);
      if (warning.path) {
        console.log(`       at: ${warning.path}`);
      }
      if (warning.suggestion) {
        console.log(`       💡 ${warning.suggestion}`);
      }
    }
  }

  console.log('');
}

function printSummary(results: ValidationResult[]): void {
  const total = results.length;
  const valid = results.filter(r => r.valid).length;
  const invalid = total - valid;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log('─'.repeat(50));
  console.log('Summary:');
  console.log(`  Total specs:     ${total}`);
  console.log(`  Valid:           ${valid} ✓`);
  console.log(`  Invalid:         ${invalid}${invalid > 0 ? ' ✗' : ''}`);
  console.log(`  Total errors:    ${totalErrors}`);
  console.log(`  Total warnings:  ${totalWarnings}`);

  if (STRICT_MODE && totalWarnings > 0) {
    console.log('\n⚠️  Strict mode enabled: Treating warnings as errors');
  }

  console.log('─'.repeat(50));

  if (invalid === 0 && (!STRICT_MODE || totalWarnings === 0)) {
    console.log('\n✅ All specifications are valid!\n');
  } else {
    console.log('\n❌ Validation failed. Please fix the errors above.\n');
  }
}

// ============================================================================
// Execution
// ============================================================================

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
