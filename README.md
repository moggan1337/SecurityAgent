# SecurityAgent 🔒

[![npm version](https://img.shields.io/npm/v/securityagent.svg)](https://www.npmjs.com/package/securityagent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A lightweight, extensible security scanning library for detecting common vulnerabilities in JavaScript and TypeScript codebases. SecurityAgent helps developers identify potential security issues early in the development cycle, supporting CWE compliance, secrets detection, and dependency auditing.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
  - [Basic Scanning](#basic-scanning)
  - [CLI Usage](#cli-usage)
  - [Integration with Build Tools](#integration-with-build-tools)
  - [Custom Rules](#custom-rules)
- [API Reference](#api-reference)
  - [SecurityScanner Class](#securityscanner-class)
  - [ScanResult Interface](#scanresult-interface)
  - [Rule Interface](#rule-interface)
- [CWE Rules](#cwe-rules)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🚨 CWE Compliance
Built-in support for detecting **10+ Common Weakness Enumeration (CWE)** vulnerabilities, including:

- **CWE-89**: SQL Injection
- **CWE-79**: Cross-Site Scripting (XSS)
- **CWE-502**: Insecure Deserialization
- And more vulnerability patterns...

### 🔑 Secrets Detection
Automatic detection of potentially exposed API keys, tokens, and credentials in your codebase.

### 📦 Dependencies Audit
Analyze project dependencies for known security vulnerabilities.

### 🔌 Extensible Architecture
Add custom scanning rules to match your organization's specific security requirements.

### 📊 Detailed Reports
Get actionable vulnerability reports with severity levels, line numbers, and remediation guidance.

### ⚡ Fast & Lightweight
Minimal dependencies with optimized scanning algorithms for quick analysis.

### 🎯 TypeScript Support
Full TypeScript support with complete type definitions.

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm

### Install via npm

```bash
npm install securityagent
```

### Install via yarn

```bash
yarn add securityagent
```

### Install via pnpm

```bash
pnpm add securityagent
```

### Install from Source

```bash
git clone https://github.com/your-org/securityagent.git
cd securityagent
npm install
npm run build
npm link
```

---

## Quick Start

### Basic Usage

```typescript
import { SecurityScanner } from 'securityagent';

// Initialize the scanner
const scanner = new SecurityScanner();

// Scan code for vulnerabilities
const code = `
  const query = "SELECT * FROM users WHERE id = " + userId;
  element.innerHTML = userInput;
`;

const vulnerabilities = scanner.scan(code);

// Display results
vulnerabilities.forEach((v) => {
  console.log(`[${v.id}] ${v.desc}`);
});
```

### Expected Output

```
[CWE-89] SQL Injection
[CWE-79] XSS Vulnerability
```

---

## Usage Examples

### Basic Scanning

#### Single File Scan

```typescript
import { SecurityScanner } from 'securityagent';
import * as fs from 'fs';

const scanner = new SecurityScanner();

// Read source file
const sourceCode = fs.readFileSync('./src/app.ts', 'utf-8');

// Perform scan
const results = scanner.scan(sourceCode);

// Output results
console.log(`Found ${results.length} potential vulnerabilities:\n`);

results.forEach((vulnerability, index) => {
  console.log(`${index + 1}. [${vulnerability.id}] ${vulnerability.desc}`);
});
```

#### Directory Scan

```typescript
import { SecurityScanner } from 'securityagent';
import * as fs from 'fs';
import * as path from 'path';

interface ScanReport {
  file: string;
  vulnerabilities: Array<{ id: string; desc: string }>;
}

function scanDirectory(dirPath: string): ScanReport[] {
  const scanner = new SecurityScanner();
  const reports: ScanReport[] = [];

  function walkDirectory(directory: string) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!file.startsWith('.') && file !== 'node_modules') {
          walkDirectory(fullPath);
        }
      } else if (/\.(ts|js|tsx|jsx)$/.test(file)) {
        const code = fs.readFileSync(fullPath, 'utf-8');
        const vulnerabilities = scanner.scan(code);

        if (vulnerabilities.length > 0) {
          reports.push({
            file: fullPath,
            vulnerabilities,
          });
        }
      }
    }
  }

  walkDirectory(dirPath);
  return reports;
}

// Scan entire src directory
const reports = scanDirectory('./src');

console.log('=== Security Scan Report ===\n');
reports.forEach((report) => {
  console.log(`📄 ${report.file}`);
  report.vulnerabilities.forEach((v) => {
    console.log(`   ⚠️  [${v.id}] ${v.desc}`);
  });
  console.log('');
});
```

#### CI/CD Integration

```typescript
import { SecurityScanner } from 'securityagent';
import * as fs from 'fs';

interface CIScanResult {
  success: boolean;
  vulnerabilities: number;
  criticalCount: number;
  reportUrl?: string;
}

function runCIScan(): CIScanResult {
  const scanner = new SecurityScanner();
  const sourceFiles = ['src/index.ts', 'src/auth.ts', 'src/api.ts'];
  let totalVulnerabilities = 0;
  let criticalCount = 0;

  for (const file of sourceFiles) {
    if (fs.existsSync(file)) {
      const code = fs.readFileSync(file, 'utf-8');
      const results = scanner.scan(code);
      totalVulnerabilities += results.length;
      criticalCount += results.filter((r) =>
        ['CWE-89', 'CWE-90', 'CWE-94'].includes(r.id)
      ).length;
    }
  }

  // Fail build if critical vulnerabilities found
  const success = criticalCount === 0;

  if (!success) {
    console.error(`❌ Build failed: ${criticalCount} critical vulnerabilities found`);
    process.exit(1);
  }

  return {
    success,
    vulnerabilities: totalVulnerabilities,
    criticalCount,
  };
}

const result = runCIScan();
console.log(`✅ Scan complete: ${result.vulnerabilities} issues found`);
```

### CLI Usage

Create a CLI script for command-line scanning:

```typescript
// bin/scan-cli.ts
import { Command } from 'commander';
import { SecurityScanner } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('security-scan')
  .description('Scan code for security vulnerabilities')
  .version('1.0.0')
  .option('-f, --file <path>', 'Single file to scan')
  .option('-d, --directory <path>', 'Directory to scan recursively')
  .option('-o, --output <path>', 'Output report file (JSON format)')
  .option('-q, --quiet', 'Suppress output, only return exit code')
  .parse(process.argv);

const options = program.opts();
const scanner = new SecurityScanner();

function scanFile(filePath: string) {
  const code = fs.readFileSync(filePath, 'utf-8');
  return scanner.scan(code);
}

function scanDir(dirPath: string) {
  const results: Record<string, any[]> = {};

  function walk(directory: string) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.')) {
        walk(fullPath);
      } else if (/\.(ts|js)$/.test(file)) {
        const vulnerabilities = scanFile(fullPath);
        if (vulnerabilities.length > 0) {
          results[fullPath] = vulnerabilities;
        }
      }
    }
  }

  walk(dirPath);
  return results;
}

// Execute scan
let results: any;

if (options.file) {
  results = { [options.file]: scanFile(options.file) };
} else if (options.directory) {
  results = scanDir(options.directory);
} else {
  console.error('Please specify --file or --directory');
  process.exit(1);
}

// Output results
if (options.output) {
  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
  console.log(`Report saved to ${options.output}`);
} else if (!options.quiet) {
  console.log(JSON.stringify(results, null, 2));
}

// Exit with error code if vulnerabilities found
const totalVulns = Object.values(results).flat().length;
process.exit(totalVulns > 0 ? 1 : 0);
```

Run the CLI:

```bash
# Scan a single file
npx ts-node bin/scan-cli.ts --file src/app.ts

# Scan a directory
npx ts-node bin/scan-cli.ts --directory ./src

# Save report to JSON
npx ts-node bin/scan-cli.ts --directory ./src --output report.json

# Quiet mode (exit code only)
npx ts-node bin/scan-cli.ts --file src/app.ts --quiet
```

### Integration with Build Tools

#### Webpack Integration

```typescript
// webpack.security-plugin.ts
import { SecurityScanner } from 'securityagent';

export class SecurityPlugin {
  private scanner: SecurityScanner;
  private failOnError: boolean;

  constructor(options: { failOnError?: boolean } = {}) {
    this.scanner = new SecurityScanner();
    this.failOnError = options.failOnError ?? false;
  }

  apply(compiler: any) {
    compiler.hooks.emit.tapAsync('SecurityPlugin', (compilation: any, callback: Function) => {
      const assets = Object.keys(compilation.assets);

      for (const asset of assets) {
        if (/\.(js|ts)$/.test(asset)) {
          const source = compilation.assets[asset].source();
          const vulnerabilities = this.scanner.scan(source);

          if (vulnerabilities.length > 0) {
            console.warn(`\n⚠️  Security warnings in ${asset}:`);
            vulnerabilities.forEach((v) => {
              console.warn(`   [${v.id}] ${v.desc}`);
            });

            if (this.failOnError) {
              callback(new Error(`Critical security vulnerability in ${asset}`));
              return;
            }
          }
        }
      }

      callback();
    });
  }
}
```

#### ESLint Integration

```typescript
// eslint-plugin-security/index.ts
import { SecurityScanner } from 'securityagent';

export const rule = {
  meta: {
    name: 'security-scanner',
    type: 'problem',
  },
  create(context) {
    const scanner = new SecurityScanner();

    return {
      Program(node) {
        const sourceCode = context.getSourceCode().getText();
        const vulnerabilities = scanner.scan(sourceCode);

        vulnerabilities.forEach((v) => {
          context.report({
            node,
            message: `Security: ${v.desc} (${v.id})`,
          });
        });
      },
    };
  },
};
```

### Custom Rules

Extend the scanner with your own security rules:

```typescript
import { SecurityScanner, Rule } from 'securityagent';

// Define custom rules
const customRules: Rule[] = [
  {
    id: 'CUSTOM-001',
    pattern: /process\.env\.[A-Z_]+/,
    desc: 'Direct environment variable access',
    severity: 'medium',
  },
  {
    id: 'CUSTOM-002',
    pattern: /eval\s*\(/,
    desc: 'Use of eval() detected',
    severity: 'high',
  },
  {
    id: 'CUSTOM-003',
    pattern: /password\s*=\s*['"][^'"]+['"]/i,
    desc: 'Hardcoded password detected',
    severity: 'critical',
  },
];

// Create scanner with custom rules
const scanner = new SecurityScanner();
scanner.addRules(customRules);

// Scan code
const code = `
  eval(userInput);
  const password = "secret123";
  const apiKey = process.env.API_KEY;
`;

const vulnerabilities = scanner.scan(code);
vulnerabilities.forEach((v) => {
  console.log(`[${v.id}] ${v.desc} (${v.severity})`);
});
```

---

## API Reference

### SecurityScanner Class

#### Constructor

```typescript
new SecurityScanner(options?: ScannerOptions)
```

Creates a new SecurityScanner instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.rules` | `Rule[]` | No | Additional custom rules to include |
| `options.excludePatterns` | `string[]` | No | Patterns to exclude from scanning |
| `options.includeWarnings` | `boolean` | No | Include warnings in results (default: true) |

**Example:**

```typescript
const scanner = new SecurityScanner({
  rules: customRules,
  excludePatterns: ['test/**', '*.test.ts'],
  includeWarnings: true,
});
```

#### Methods

##### `scan(code: string): ScanResult[]`

Scans the provided code for security vulnerabilities.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Source code to scan |

**Returns:** `ScanResult[]` - Array of detected vulnerabilities

**Example:**

```typescript
const code = `
  const query = "SELECT * FROM users WHERE id = " + userId;
  document.body.innerHTML = userContent;
`;

const results = scanner.scan(code);
// [
//   { id: 'CWE-89', desc: 'SQL Injection' },
//   { id: 'CWE-79', desc: 'XSS Vulnerability' }
// ]
```

##### `addRules(rules: Rule[]): void`

Adds custom rules to the scanner.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rules` | `Rule[]` | Yes | Array of rules to add |

**Example:**

```typescript
scanner.addRules([
  { id: 'CUSTOM-001', pattern: /dangerous/, desc: 'Dangerous pattern' },
]);
```

##### `removeRule(ruleId: string): boolean`

Removes a rule from the scanner by its ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ruleId` | `string` | Yes | ID of the rule to remove |

**Returns:** `boolean` - True if rule was found and removed

##### `getRules(): Rule[]`

Returns all currently active rules.

**Returns:** `Rule[]` - Array of all active rules

##### `resetRules(): void`

Resets all rules to the default set.

**Example:**

```typescript
scanner.resetRules();
```

---

### ScanResult Interface

```typescript
interface ScanResult {
  id: string;
  desc: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  column?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | CWE identifier or custom rule ID |
| `desc` | `string` | Human-readable vulnerability description |
| `severity` | `string` | Optional severity level |
| `line` | `number` | Optional line number where vulnerability was found |
| `column` | `number` | Optional column number where vulnerability was found |

---

### Rule Interface

```typescript
interface Rule {
  id: string;
  pattern: RegExp;
  desc: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the rule |
| `pattern` | `RegExp` | Yes | Regular expression pattern to match |
| `desc` | `string` | Yes | Human-readable rule description |
| `severity` | `string` | No | Severity level of matches (default: 'medium') |
| `message` | `string` | No | Custom message to display for matches |

---

## CWE Rules

SecurityAgent includes the following built-in CWE rules:

| ID | Name | Severity | Description |
|----|------|----------|-------------|
| CWE-89 | SQL Injection | Critical | Detects potential SQL injection vulnerabilities |
| CWE-79 | Cross-Site Scripting (XSS) | High | Detects improper input handling that could lead to XSS |
| CWE-502 | Insecure Deserialization | High | Detects unsafe deserialization patterns |
| CWE-78 | OS Command Injection | Critical | Detects shell command execution from user input |
| CWE-94 | Code Injection | Critical | Detects dynamic code execution vulnerabilities |
| CWE-22 | Path Traversal | High | Detects file path manipulation vulnerabilities |
| CWE-90 | LDAP Injection | Medium | Detects potential LDAP injection points |
| CWE-601 | Open Redirect | Medium | Detects potential open redirect vulnerabilities |
| CWE-287 | Improper Authentication | Critical | Detects weak authentication patterns |
| CWE-306 | Missing Authentication | Critical | Detects functions missing authentication checks |

---

## Configuration

### Configuration File

Create a `.securityagentrc` file in your project root:

```json
{
  "rules": [
    {
      "id": "CUSTOM-001",
      "pattern": "hardcoded_secret",
      "desc": "Hardcoded secret detected",
      "severity": "critical"
    }
  ],
  "exclude": ["**/*.test.ts", "**/node_modules/**"],
  "failOnCritical": true,
  "outputFormat": "json"
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECURITY_AGENT_FAIL_ON_ERROR` | Exit with error on critical findings | `false` |
| `SECURITY_AGENT_OUTPUT_FORMAT` | Output format (json/text) | `text` |
| `SECURITY_AGENT_LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |

---

## Best Practices

### 1. Integrate Early in Development

Add SecurityAgent to your IDE and pre-commit hooks:

```bash
# Install as dev dependency
npm install --save-dev securityagent

# Add to pre-commit hook
npx husky add .husky/pre-commit "npx security-scan --directory ./src"
```

### 2. Regular Scanning in CI/CD

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run security-scan
```

### 3. Prioritize Critical Issues

Always address critical and high severity findings first:

1. SQL Injections (CWE-89)
2. Code Injections (CWE-94)
3. Command Injections (CWE-78)
4. Authentication issues (CWE-287, CWE-306)

### 4. Keep Rules Updated

Regularly update your custom rules to address new vulnerability patterns:

```typescript
// Update rules quarterly or after security incidents
const updatedRules: Rule[] = [
  ...scanner.getRules(),
  {
    id: 'NEW-001',
    pattern: /new_vulnerability_pattern/,
    desc: 'Description of new vulnerability',
    severity: 'high',
  },
];

scanner.resetRules();
scanner.addRules(updatedRules);
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/securityagent.git
cd securityagent

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run linter
npm run lint
```

### Pull Request Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2024 SecurityAgent Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<p align="center">
  Made with ❤️ by the SecurityAgent Team
</p>
