#!/usr/bin/env tsx
/**
 * Download OpenAPI specifications from NFE.io API
 *
 * This script attempts to download OpenAPI specs from known endpoints.
 * Falls back gracefully if specs are not publicly available.
 *
 * Usage:
 *   npm run download:spec
 *   tsx scripts/download-openapi.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface SpecEndpoint {
  name: string;
  url: string;
  outputFile: string;
}

// Known spec endpoints (may not be publicly available)
const SPEC_ENDPOINTS: SpecEndpoint[] = [
  {
    name: 'NF-e Serviço (Service Invoices)',
    url: 'https://api.nfe.io/openapi/nf-servico-v1.json',
    outputFile: 'nf-servico-v1.yaml',
  },
  {
    name: 'NF-e Produto',
    url: 'https://api.nfe.io/openapi/nf-produto-v2.json',
    outputFile: 'nf-produto-v2.yaml',
  },
  {
    name: 'NF-e Consumidor',
    url: 'https://api.nfe.io/openapi/nf-consumidor-v2.json',
    outputFile: 'nf-consumidor-v2.yaml',
  },
  {
    name: 'OpenAPI Main',
    url: 'https://api.nfe.io/openapi.json',
    outputFile: 'nfeio.yaml',
  },
  {
    name: 'OpenAPI v1',
    url: 'https://api.nfe.io/v1/openapi.json',
    outputFile: 'nfeio-v1.yaml',
  },
];

const OUTPUT_DIR = 'openapi/spec';

/**
 * Convert JSON to YAML format (simple implementation)
 */
function jsonToYaml(json: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(json)) {
    json.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}-\n${jsonToYaml(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${item}\n`;
      }
    });
  } else if (typeof json === 'object' && json !== null) {
    Object.entries(json).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else if (typeof value === 'string') {
        const needsQuotes = value.includes(':') || value.includes('#') || value.includes('\n');
        yaml += `${spaces}${key}: ${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    });
  }

  return yaml;
}

/**
 * Download spec from URL
 */
async function downloadSpec(endpoint: SpecEndpoint): Promise<boolean> {
  try {
    console.log(`📥 Downloading: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);

    const response = await fetch(endpoint.url, {
      headers: {
        'Accept': 'application/json, application/yaml, application/x-yaml, text/yaml',
        'User-Agent': 'NFE.io SDK OpenAPI Downloader',
      },
    });

    if (!response.ok) {
      console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const contentType = response.headers.get('content-type') || '';
    let content: string;

    if (contentType.includes('json')) {
      const json = await response.json();
      content = jsonToYaml(json);
    } else {
      content = await response.text();
    }

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write to file
    const outputPath = join(OUTPUT_DIR, endpoint.outputFile);
    writeFileSync(outputPath, content, 'utf8');

    console.log(`   ✅ Saved to: ${outputPath}`);
    console.log(`   📊 Size: ${(content.length / 1024).toFixed(2)} KB`);
    return true;

  } catch (error) {
    if (error instanceof Error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ❌ Unknown error`);
    }
    return false;
  }
}

/**
 * Main download function
 */
async function main() {
  console.log('🔍 NFE.io OpenAPI Spec Downloader');
  console.log('==================================\n');

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of SPEC_ENDPOINTS) {
    const success = await downloadSpec(endpoint);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // Blank line between downloads
  }

  console.log('==================================');
  console.log(`✅ Downloaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  if (successCount === 0) {
    console.log('\n⚠️  No specs downloaded.');
    console.log('   This is expected if NFE.io does not expose public OpenAPI endpoints.');
    console.log('   Manual spec creation may be required.\n');
    console.log('   See: https://github.com/nfe/client-nodejs/blob/main/CONTRIBUTING.md\n');
  } else {
    console.log('\n✨ Success! Run `npm run validate:spec` to validate downloaded specs.\n');
  }

  // Exit with error code if all downloads failed
  if (successCount === 0 && failCount > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { downloadSpec, SPEC_ENDPOINTS };
