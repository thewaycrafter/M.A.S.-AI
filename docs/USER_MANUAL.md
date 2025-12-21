# M.A.S. AI - User Manual

## 📖 Table of Contents
1. [Getting Started](#getting-started)
2. [Running Your First Scan](#first-scan)
3. [Understanding Results](#results)
4. [Advanced Features](#advanced)
5. [Administration](#admin)
6. [Troubleshooting](#troubleshooting)

---

## 1. Getting Started {#getting-started}

### Accessing the Application
1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You'll see the M.A.S. AI homepage

### System Overview
M.A.S. AI is an enterprise-grade AI-powered penetration testing platform that:
- Scans web applications for 200+ vulnerability types
- Uses 7 AI agents + 10 specialized scanners
- Provides real-time attack visualization
- Generates professional PDF reports

---

## 2. Running Your First Scan {#first-scan}

### Step 1: Navigate to Dashboard
Click "LAUNCH DASHBOARD" from the homepage

### Step 2: Start a Scan
1. Click the green "NEW SCAN" button
2. Enter your target (e.g., `example.com`)
   - Use domain names or IP addresses
   - Ensure target is authorized
3. Click "START SCAN"

### Step 3: Monitor Progress
Watch the real-time console as:
- AI agents analyze your target
- Vulnerabilities are discovered
- Security checks run across 19 categories

**Typical scan duration:** 30-40 seconds

### Step 4: View Results
The dashboard automatically updates with:
- **Critical vulnerabilities** (red)
- **High severity** (orange)
- **Medium severity** (yellow)
- **Overall risk score** (0-10)

---

## 3. Understanding Results {#results}

### Dashboard Tabs

#### Console Tab
Real-time logs showing:
```
[RECON] Starting passive reconnaissance...
[THREAT_MODEL] Analyzing attack surface...
[VULN_REASON] Testing for SQL injection...
✓ Found: SQL Injection in /api/users
```

#### Report Tab
Summary of all findings:
- Total vulnerabilities by severity
- Category breakdown
- Affected endpoints
- Risk assessment

#### Attack Surface Tab (NEW!)
Interactive D3.js visualization:
- **Drag nodes** to rearrange
- **Scroll** to zoom in/out
- **Click vulnerabilities** for details
- Color-coded by severity

#### Timeline Tab (NEW!)
Historical trends:
- Track vulnerability counts over time
- See if security is improving
- Compare scan results

### Metrics Explained

**Risk Score (0-10)**
- 0-3: Low risk ✅
- 4-6: Medium risk ⚠️
- 7-8: High risk 🔴
- 9-10: Critical risk 🚨

**Severity Levels**
- **Critical**: Immediate action required
- **High**: Fix within 24 hours
- **Medium**: Fix within 1 week
- **Low**: Fix when possible

---

## 4. Advanced Features {#advanced}

### AI Reasoning View
See how AI identified each vulnerability:
1. Click any vulnerability
2. View "AI Reasoning" tab  
3. See step-by-step decision process
4. Review confidence scores
5. Check evidence

### Remediation Guides
Get secure code fixes:
1. Select a vulnerability
2. View "Remediation" tab
3. See vulnerable vs secure code side-by-side
4. Copy secure code
5. Download patch file

### Export Options

**JSON Export**
```bash
# Click "EXPORT JSON" button
# Downloads: aegis_export_<timestamp>.json
```

**PDF Reports**
```bash
# Click "DOWNLOAD PDF" button
# Professional report with:
# - Executive summary
# - Detailed findings
# - Remediation steps
# - Risk visualization
```

### Kill Switch
Emergency stop button:
1. Click red "KILL SWITCH" button
2. Confirm action
3. All scans immediately stop
4. Event logged to audit trail

---

## 5. Administration {#admin}

### User Authorization Management (New!)
**URL:** `/authorizations`

**Features:**
- View status of all your scan requests (Pending, Approved, Denied)
- Request authorization for new domains
- Send email reminders to approvers
- Filter requests by status

### Admin Authorization Management
**URL:** `/admin/authorization`

**Add Authorized Target:**
1. Enter domain (e.g., `example.com`)
2. Use wildcards for subdomains (`*.example.com`)
3. Click "Add Target"

**Test Authorization:**
1. Enter target to test
2. Click "Test"
3. See if authorized ✅ or denied ❌

### Audit Log Viewer
**URL:** `/admin/audit`

**Features:**
- Search logs by target or action
- Filter by event type
- Verify HMAC signatures
- Export to CSV

**Event Types:**
- `scan_start`: Scan initiated
- `scan_complete`: Scan finished
- `authorization_check`: Target validated
- `killswitch_activated`: Emergency stop

---

## 6. Troubleshooting {#troubleshooting}

### Common Issues

**Q: Scan shows "Access Denied"**
```
A: Target not in authorized whitelist
   → Add to /admin/authorization
```

**Q: No vulnerabilities found**
```
A: Either target is secure OR:
   → Check OpenAI API key is valid
   → Verify target is accessible
   → Review authorization settings
```

**Q: WebSocket disconnected**
```
A: Real-time updates stopped
   → Refresh page
   → Check backend is running (port 3001)
   → Verify no firewall blocking WebSocket
```

**Q: PDF download fails**
```
A: Report generation error
   → Check backend logs
   → Ensure disk space available
   → Try smaller scan results
```

**Q: Console shows errors**
```
A: Open browser DevTools (F12)
   → Check Console tab for errors
   → Network tab for failed requests
   → Contact support with error details
```

### Reset Data
To clear all scan data:
1. Click "RESET" button
2. Confirm action
3. Dashboard returns to initial state

---

## 📚 Additional Resources

- **API Documentation:** `/docs/API.md`
- **Deployment Guide:** `/docs/DEPLOYMENT.md`
- **Security Best Practices:** See OWASP guidelines
- **Scan Parameters:** Visit `/scans` page

---

## 🆘 Support

**Issues or Questions?**
- GitHub Issues: [your-repo/issues](https://github.com/your-org/mas-ai/issues)
- Email: support@mas-ai.com
- Documentation: [docs.mas-ai.com](https://docs.mas-ai.com)

---

**Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Status:** Production Ready 🚀
