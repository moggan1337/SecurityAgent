# SecurityAgent 🔒

**Security Scanning** - Vulnerability detection.

## Features

- **🚨 CWE** - 10+ CWE rules
- **🔑 Secrets** - API key detection
- **📦 Dependencies** - Audit dependencies

## Installation

```bash
npm install securityagent
```

## Usage

```typescript
import { SecurityScanner } from 'securityagent';

const scanner = new SecurityScanner();
const vulnerabilities = scanner.scan(code);

vulnerabilities.forEach(v => {
  console.log(`[${v.id}] ${v.desc}`);
});
```

## CWE Rules

| ID | Description |
|----|-------------|
| CWE-89 | SQL Injection |
| CWE-79 | XSS |
| CWE-502 | Deserialization |

## License

MIT
