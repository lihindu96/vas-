# Security Considerations

## Known Vulnerabilities and Mitigations

### xlsx Package (version 0.18.5)

The `xlsx` package currently used has known vulnerabilities:

1. **Regular Expression Denial of Service (ReDoS)**
   - Affected versions: < 0.20.2
   - Issue: The library's regular expressions can be exploited with crafted input
   - **Mitigation implemented**:
     - File size limited to 5MB via Multer configuration
     - Row count limited to 10,000 rows
     - File type validation (only .xlsx and .xls allowed)

2. **Prototype Pollution**
   - Affected versions: < 0.19.3
   - Issue: Malicious Excel files could pollute JavaScript object prototypes
   - **Mitigation implemented**:
     - Input sanitization: All values from Excel are explicitly converted to String/Number
     - Length limits: All string fields have maximum length constraints
     - Type validation: Explicit parsing and validation of all input data

### Why Not Upgrade?

As of the implementation date, the patched versions (0.19.3, 0.20.2) mentioned in the advisories are not available in the npm registry. The latest version available is 0.18.5.

## Security Measures Implemented

### 1. File Upload Security
- File size limit: 5MB maximum
- File type restriction: Only .xlsx and .xls files accepted
- Single file upload only
- Files stored in uploads/ directory (should be outside web root in production)

### 2. Input Validation and Sanitization
- PO Number: Max 100 characters
- Item Code: Max 100 characters
- Item Description: Max 500 characters
- Quantity: Integer between 0 and 999,999
- Assigned To: Max 100 characters
- Notes: Max 1,000 characters

### 3. Data Processing Limits
- Maximum 10,000 rows per Excel file
- Prevents memory exhaustion attacks

### 4. Error Handling
- Generic error messages to avoid information leakage
- Detailed errors logged server-side only
- No stack traces sent to clients

## Production Security Recommendations

When deploying to production, implement these additional security measures:

1. **Authentication and Authorization**
   - Add user authentication (OAuth, JWT, etc.)
   - Implement role-based access control
   - Audit logging for all operations

2. **HTTPS**
   - Use HTTPS for all communication
   - Implement HSTS headers

3. **Database Security**
   - Replace in-memory storage with a proper database
   - Use parameterized queries to prevent SQL injection
   - Implement database access controls

4. **File Storage**
   - Store uploaded files outside the web root
   - Scan uploaded files for malware
   - Implement file retention policies

5. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Prevent brute force and DoS attacks

6. **Security Headers**
   - Add helmet.js for security headers
   - Implement CSP (Content Security Policy)
   - Enable CORS only for trusted origins

7. **Input Validation**
   - Consider using a validation library like Joi or express-validator
   - Implement stricter validation rules

8. **Monitoring and Logging**
   - Implement comprehensive logging
   - Set up security monitoring and alerting
   - Regular security audits

## Vulnerability Scanning

Regular security scanning should be performed:

```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities when updates are available
npm audit fix

# Generate security report
npm audit --json > security-report.json
```

## Updates

Monitor the xlsx package for updates:
- GitHub: https://github.com/SheetJS/sheetjs
- NPM: https://www.npmjs.com/package/xlsx

When a patched version becomes available, update immediately and test thoroughly.
