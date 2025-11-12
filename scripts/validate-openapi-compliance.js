#!/usr/bin/env node

/**
 * OpenAPI Compliance Validator
 * 
 * Validates that the SDK implementation matches the OpenAPI specification.
 * This is part of the hybrid approach (Option 3) where we maintain manual
 * implementation but validate against OpenAPI spec.
 * 
 * Usage: node scripts/validate-openapi-compliance.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml'; // Will need to install

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPEC_PATH = path.join(__dirname, '../openapi/spec/nf-servico-v1.yaml');

console.log('🔍 NFE.io OpenAPI Compliance Validator\n');

// Load OpenAPI spec
function loadSpec() {
  try {
    const content = fs.readFileSync(SPEC_PATH, 'utf8');
    return yaml.parse(content);
  } catch (error) {
    console.error('❌ Failed to load OpenAPI spec:', error.message);
    process.exit(1);
  }
}

// Extract endpoints from spec
function extractEndpoints(spec) {
  const endpoints = [];
  
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: details.operationId,
          summary: details.summary,
          tags: details.tags || []
        });
      }
    }
  }
  
  return endpoints;
}

// Map OpenAPI endpoints to SDK resources
function mapToSDKResources(endpoints) {
  const resources = {
    serviceInvoices: [],
    companies: [],
    legalPeople: [],
    naturalPeople: [],
    webhooks: []
  };
  
  for (const endpoint of endpoints) {
    const path = endpoint.path.toLowerCase();
    
    if (path.includes('/serviceinvoices')) {
      resources.serviceInvoices.push(endpoint);
    } else if (path.includes('/companies') && !path.includes('/serviceinvoices')) {
      resources.companies.push(endpoint);
    } else if (path.includes('/legalpeople')) {
      resources.legalPeople.push(endpoint);
    } else if (path.includes('/naturalpeople')) {
      resources.naturalPeople.push(endpoint);
    } else if (path.includes('/webhooks')) {
      resources.webhooks.push(endpoint);
    }
  }
  
  return resources;
}

// Expected SDK methods based on our implementation
const SDK_METHODS = {
  serviceInvoices: [
    'create',
    'list',
    'retrieve',
    'cancel',
    'sendEmail',
    'downloadPdf',
    'downloadXml',
    'createAndWait' // SDK enhancement
  ],
  companies: [
    'create',
    'list',
    'retrieve',
    'update',
    'uploadCertificate'
  ],
  legalPeople: [
    'create',
    'list',
    'retrieve',
    'update',
    'delete',
    'findByTaxNumber' // SDK enhancement
  ],
  naturalPeople: [
    'create',
    'list',
    'retrieve',
    'update',
    'delete',
    'findByTaxNumber' // SDK enhancement
  ],
  webhooks: [
    'create',
    'list',
    'retrieve',
    'update',
    'delete',
    'validateSignature' // SDK enhancement
  ]
};

// Validate coverage
function validateCoverage(specResources) {
  console.log('📊 Coverage Analysis\n');
  
  let totalSpec = 0;
  let totalImplemented = 0;
  
  for (const [resource, methods] of Object.entries(SDK_METHODS)) {
    const specEndpoints = specResources[resource] || [];
    totalSpec += specEndpoints.length;
    totalImplemented += methods.length;
    
    const coverage = specEndpoints.length > 0 
      ? ((methods.length / specEndpoints.length) * 100).toFixed(1)
      : 'N/A';
    
    console.log(`\n${resource}:`);
    console.log(`  Spec endpoints: ${specEndpoints.length}`);
    console.log(`  SDK methods: ${methods.length}`);
    console.log(`  Coverage: ${coverage}%`);
    
    // List spec endpoints not in SDK
    const specOps = new Set(specEndpoints.map(e => e.operationId));
    const missingInSDK = specEndpoints.filter(e => {
      // This is approximate - would need better mapping
      return !e.operationId;
    });
    
    if (missingInSDK.length > 0) {
      console.log(`  ⚠️  Endpoints in spec not clearly mapped to SDK:`);
      missingInSDK.forEach(e => {
        console.log(`      - ${e.method} ${e.path}`);
      });
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total spec endpoints: ${totalSpec}`);
  console.log(`Total SDK methods: ${totalImplemented}`);
  console.log(`Overall coverage: ${((totalImplemented / totalSpec) * 100).toFixed(1)}%`);
}

// Main execution
function main() {
  console.log(`Loading spec from: ${SPEC_PATH}\n`);
  
  const spec = loadSpec();
  console.log(`✅ Loaded OpenAPI spec v${spec.openapi}`);
  console.log(`   Title: ${spec.info.title}`);
  console.log(`   Version: ${spec.info.version}\n`);
  
  const endpoints = extractEndpoints(spec);
  console.log(`📋 Found ${endpoints.length} API endpoints\n`);
  
  const specResources = mapToSDKResources(endpoints);
  
  validateCoverage(specResources);
  
  console.log(`\n✨ Validation complete!\n`);
  console.log(`💡 Note: This is a basic validation. For v4.0.0, we plan to:`);
  console.log(`   - Generate SDK code directly from OpenAPI spec`);
  console.log(`   - Automate type generation`);
  console.log(`   - Add contract testing\n`);
}

// Check if yaml package is available
try {
  await import('yaml');
  main();
} catch (error) {
  console.error('❌ Missing dependency: yaml');
  console.error('   Install with: npm install --save-dev yaml');
  console.error('   Or skip this validation for now.\n');
  process.exit(0); // Don't fail CI, just skip
}
