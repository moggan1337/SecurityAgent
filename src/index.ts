export class SecurityScanner {
  private rules = [
    { id: 'CWE-89', pattern: /SQL.*\$\{/, desc: 'SQL Injection' },
    { id: 'CWE-79', pattern: /innerHTML/, desc: 'XSS Vulnerability' },
    { id: 'CWE-502', pattern: /deserialize.*user/, desc: 'Insecure Deserialization' }
  ];
  
  scan(code: string): { id: string; desc: string }[] {
    return this.rules.filter(r => r.pattern.test(code)).map(r => ({ id: r.id, desc: r.desc }));
  }
}
export default SecurityScanner;
