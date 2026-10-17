# Integration Tests

These tests validate the NFE.io SDK against the **real API** (development or production environment).

## ⚠️ Important Notes

- **Real API calls**: These tests make actual HTTP requests to NFE.io API
- **API key required**: You must provide valid credentials
- **Costs may apply**: Depending on your NFE.io plan, API calls might incur costs
- **Cleanup**: `companies.remove` answers with success but the company stays in the account with
  status `Inactive` (measured 2026-10-16), so the company write tests leave data behind. They
  are opt-in for that reason (`NFE_ALLOW_ACCOUNT_WRITES`)
- **`npm test` runs them too**: outside CI, the full suite includes these tests whenever an API
  key is set in `.env`

## 🔧 Setup

### 1. Get API Credentials

- **Development/Test**: Create account at [NFE.io](https://nfe.io) and use a test API key
- **Production**: Use your production API key (⚠️ not recommended for testing)

**Note**: NFE.io API uses the same endpoint (`https://api.nfe.io/v1`) for both environments. The difference is determined by the API key you use, not the URL.

### 2. Configure Environment Variables

```bash
# Required: API key (test/development key recommended)
export NFE_API_KEY="your-development-api-key"

# Optional: Test environment (default: development)
export NFE_TEST_ENVIRONMENT="development"  # or "production"

# Optional: Enable integration tests in CI
export RUN_INTEGRATION_TESTS="true"

# Optional: allow tests that create, update or delete companies in the account.
# Only with an account of your own that you can throw away -- never with a key
# shared by a team, since those writes touch everyone's data.
export NFE_ALLOW_ACCOUNT_WRITES="true"

# Optional: Debug logging
export DEBUG_INTEGRATION_TESTS="true"
```

**Windows (PowerShell)**:
```powershell
$env:NFE_API_KEY="your-development-api-key"
$env:NFE_TEST_ENVIRONMENT="development"
$env:RUN_INTEGRATION_TESTS="true"
```

### 3. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm test tests/integration/companies.integration.test.ts

# Run with debug logging
DEBUG_INTEGRATION_TESTS=true npm test tests/integration/

# Run with coverage
npm run test:integration -- --coverage
```

## 📁 Test Files

### `setup.ts`
- Environment configuration
- Test data helpers
- Cleanup utilities
- Client factory

### `companies.integration.test.ts`
- CRUD operations for Companies, including duplicate CNPJ: **skipped unless
  `NFE_ALLOW_ACCOUNT_WRITES=true`**, because they create and delete companies in the account
- Certificate upload (skipped - requires PFX file)
- Validation error handling (runs by default: the API rejects the body, nothing is written)
- 404 for a non-existent company (runs by default)

**Tests**: 9 tests: 6 need `NFE_ALLOW_ACCOUNT_WRITES=true`, 2 run by default, 1 always skipped

### `service-invoices.integration.test.ts`
- Complete invoice workflow
- Synchronous (201) and asynchronous (202) creation
- Polling until completion
- PDF/XML downloads
- Email sending
- Invoice cancellation
- Validation and error handling

**Tests**: 13 tests

**Duration**: ~5-10 minutes (includes polling waits)

### `errors.integration.test.ts`
- Authentication errors (401)
- Not found errors (404)
- Validation errors (400/422)
- Network timeouts
- Retry logic verification
- Rate limiting behavior
- Concurrent requests
- Error detail preservation

**Tests**: 10 tests

## 🎯 What Gets Tested

### Companies Resource
✅ Create company  
✅ Retrieve company by ID  
✅ List companies  
✅ Update company  
✅ Delete company  
✅ 404 handling  
✅ Validation errors  
✅ Duplicate CNPJ detection  
⏭️ Certificate upload (skipped)

### ServiceInvoices Resource
✅ Synchronous invoice creation (201)  
✅ Asynchronous invoice creation (202)  
✅ Polling until completion  
✅ `createAndWait()` helper  
✅ Retrieve invoice  
✅ List invoices  
✅ Cancel invoice  
✅ Send invoice email  
✅ Download PDF  
✅ Download XML  
✅ Validation errors  
✅ 404 handling  
✅ Polling timeout

### Error Handling
✅ 401 Authentication error  
✅ 404 Not found error  
✅ 400/422 Validation error  
✅ Network timeout  
✅ Retry logic  
✅ Rate limiting (if enforced)  
✅ Malformed response handling  
✅ Error detail preservation  
✅ Concurrent requests  
✅ Empty response lists

## 🚫 Skipped Tests

Integration tests are automatically skipped when:
- No API key is configured (`NFE_API_KEY` not set)
- Running in CI without explicit opt-in (`RUN_INTEGRATION_TESTS` not set)

You'll see: `"Skipping integration tests - no API key configured"`

Individual tests can be skipped with `.skip()`:
```typescript
it.skip('test that requires special setup', async () => {
  // ...
});
```

## 🧹 Cleanup

Tests automatically cleanup created resources:
- Companies get `companies.remove` after tests, but the API keeps them in the account with
  status `Inactive`
- Invoices are cancelled after tests
- Errors during cleanup are logged but don't fail tests

**Manual cleanup** (if tests crash):
```bash
# List companies
curl -X GET https://api.nfe.io/v1/companies \
  -H "Authorization: Bearer YOUR_API_KEY"

# Delete company
curl -X DELETE https://api.nfe.io/v1/companies/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## ⏱️ Timeouts

- Default test timeout: **30 seconds**
- Invoice polling tests: **90 seconds** (waits for processing)
- Configurable via `INTEGRATION_TEST_CONFIG.timeout` in `setup.ts`

## 🔍 Debugging

### Enable verbose logging:
```bash
DEBUG_INTEGRATION_TESTS=true npm test tests/integration/
```

### Run single test:
```bash
npm test tests/integration/companies.integration.test.ts -- -t "should create a company"
```

### Check API responses:
- Tests log important events when `DEBUG_INTEGRATION_TESTS=true`
- Check `logTestInfo()` outputs in console

## 🏗️ Adding New Integration Tests

1. Create new test file: `tests/integration/your-resource.integration.test.ts`
2. Import setup utilities:
```typescript
import {
  createIntegrationClient,
  skipIfNoApiKey,
  cleanupTestCompany,
  logTestInfo,
  INTEGRATION_TEST_CONFIG,
} from './setup.js';
```

3. Use `skipIfNoApiKey()` to skip when no credentials:
```typescript
it.skipIf(skipIfNoApiKey())('your test', async () => {
  const client = createIntegrationClient();
  // ... test code
}, { timeout: INTEGRATION_TEST_CONFIG.timeout });
```

4. Always cleanup resources:
```typescript
afterEach(async () => {
  await cleanupTestCompany(client, companyId);
});
```

## 📊 Expected Results

All tests should pass when:
- Valid development/test API key is configured
- NFE.io API is operational
- Network connection is stable

**Passing rate**: 100% (excluding skipped tests)

**Common failures**:
- ❌ "Skipping integration tests - no API key configured" → Set `NFE_API_KEY`
- ❌ "Authentication error" → Check API key validity
- ❌ "Timeout waiting for invoice" → API might be slow, increase timeout
- ❌ "Network error" → Check internet connection

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  workflow_dispatch:  # Manual trigger

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      
      - name: Run integration tests
        env:
          NFE_API_KEY: ${{ secrets.NFE_DEV_API_KEY }}
          NFE_TEST_ENVIRONMENT: development
          RUN_INTEGRATION_TESTS: true
        run: npm run test:integration
```

**Secrets to configure**:
- `NFE_DEV_API_KEY`: Your development/test API key

## 📝 Notes

- Integration tests take **5-10 minutes** due to invoice processing waits
- Tests use **development environment by default** with test API keys to avoid production costs
- Some tests (like certificate upload) are **skipped** as they require external files
- Rate limiting tests might not trigger limits in development
- All tests are **isolated** and don't depend on each other

## 🆘 Troubleshooting

### "TypeError: client is undefined"
→ API key not configured, tests are being skipped

### "Timeout waiting for invoice to complete"
→ Increase timeout in test or check API status

### "Authentication failed"
→ Check API key validity and environment configuration

### "Network request failed"
→ Check internet connection and API status

### Tests leave orphaned data
→ Run manual cleanup commands listed above

---

**Ready to test?** Set your API key and run:
```bash
export NFE_API_KEY="your-key"
npm run test:integration
```
