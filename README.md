<div align="center">

# 🛡️ M.A.S. AI

### **M**ulti-agent **A**daptive **S**ecurity

<p align="center">
  <strong>Defensive-First AI-Powered Penetration Testing Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Agents-7-00ff41?style=flat-square" alt="AI Agents"/>
  <img src="https://img.shields.io/badge/Security%20Scanners-10-00e5a0?style=flat-square" alt="Scanners"/>
  <img src="https://img.shields.io/badge/Vulnerability%20Classes-200%2B-ff6b00?style=flat-square" alt="Vulnerabilities"/>
  <img src="https://img.shields.io/badge/OWASP%20Coverage-100%25-00ff41?style=flat-square" alt="OWASP"/>
</p>

</div>

---

## 📖 Overview

**M.A.S. AI** is an enterprise-grade, defensive-first AI penetration testing platform that leverages multiple specialized AI agents to perform comprehensive security assessments. Unlike traditional scanners, M.A.S. AI uses adaptive reasoning to understand application context and discover complex vulnerabilities.

### 🎯 Why M.A.S. AI?

| Traditional Scanners | M.A.S. AI |
|---------------------|-----------|
| Rule-based detection | AI-powered reasoning |
| High false positives | Context-aware validation |
| Surface-level scans | Deep business logic analysis |
| Manual configuration | Adaptive scanning |
| Single methodology | 7 specialized AI agents |

---

## ✨ Features

### 🤖 7 Specialized AI Agents

| Agent | Purpose |
|-------|---------|
| **RECON** | Reconnaissance and asset discovery |
| **THREAT_MODEL** | Threat modeling and risk assessment |
| **VULN_REASON** | Vulnerability reasoning and analysis |
| **EXPLOIT_SIM** | Exploit simulation and validation |
| **BIZ_LOGIC** | Business logic vulnerability detection |
| **DEFENSE** | Defense strategy recommendations |
| **FUTURE_THREAT** | Emerging threat prediction |

### 🔍 10 Security Scanners

- **Authentication Scanner** - Session management, password policies, MFA bypass
- **Authorization Scanner** - IDOR, privilege escalation, access control
- **Cryptography Scanner** - Weak ciphers, key management, TLS issues
- **Web Scanner** - XSS, SQL injection, CSRF, OWASP Top 10
- **Network Scanner** - Open ports, service enumeration, misconfigurations
- **Cloud Scanner** - AWS/GCP/Azure misconfigurations, IAM issues
- **API Scanner** - REST/GraphQL vulnerabilities, rate limiting
- **Business Logic Scanner** - Workflow bypass, race conditions
- **Client-Side Scanner** - DOM XSS, prototype pollution
- **Supply Chain Scanner** - Dependency vulnerabilities, SBOMs

### 🎮 Platform Features

- **Real-Time Console** - Live attack console with WebSocket updates
- **Authorization Gating** - Domain owner approval before scanning
- **PDF Reports** - Professional security assessment reports
- **Kill Switch** - Instant scan termination for safety
- **Audit Logging** - Immutable HMAC-signed audit trails
- **Role-Based Access** - Admin, Business, Pro, and Free tier management
- **Usage Analytics** - Scan history, vulnerability trends

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/theWayCrafter/masai.git
cd masai

# Install dependencies
npm run install:all
# or
cd backend && npm install && cd ../frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/masai

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (for authorization flow)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@masai.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Optional: Razorpay (for payments)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Optional: PostgreSQL (for audit logs)
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=masai_audit
```

### Running the Application

```bash
# Start both frontend and backend
./start.sh

# Or run separately:
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/health

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Dashboard │ │ History  │ │Authorizat│ │   Admin Panel    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                 │              │
│       └────────────┴────────────┴─────────────────┘              │
│                            │                                      │
│                    WebSocket + REST API                           │
└────────────────────────────┼──────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                     Backend (Express.js)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │   Routes    │  │ Middleware  │  │     Services            │   │
│  │  - auth     │  │ - JWT Auth  │  │  - AI Agents (7)        │   │
│  │  - scans    │  │ - Rate Limit│  │  - Scanners (10)        │   │
│  │  - reports  │  │ - RBAC      │  │  - PDF Generator        │   │
│  │  - admin    │  │ - Logging   │  │  - Email Service        │   │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘   │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │ MongoDB │        │ PostgreSQL│       │   Redis   │
    │ (Scans) │        │  (Audit)  │       │  (Cache)  │
    └─────────┘        └───────────┘       └───────────┘
```

---

## 📁 Project Structure

```
masai/
├── backend/
│   ├── src/
│   │   ├── api/routes/          # API routes
│   │   ├── agents/              # AI agents
│   │   ├── scanners/            # Security scanners
│   │   ├── services/            # Business logic
│   │   ├── models/              # MongoDB schemas
│   │   ├── middleware/          # Auth, logging, etc.
│   │   └── server.ts            # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   ├── components/          # React components
│   │   └── utils/               # Helpers
│   └── package.json
│
├── .env                         # Environment variables
├── start.sh                     # Startup script
└── README.md
```

---

## 🔐 Security Features

### Authorization Flow

1. **User requests scan** → Enters target domain
2. **Domain owner notified** → Receives approval email
3. **Owner approves/denies** → Clicks email link
4. **Admin reviews** → Final approval (or bypass)
5. **Scan authorized** → User can now scan

### Kill Switch

Emergency stop button that immediately terminates all scanning activity with a single click.

### Audit Logging

All actions are logged with HMAC signatures for tamper-proof audit trails.

---

## 📊 API Reference

### Authentication

```http
POST /api/auth/register    # Create account
POST /api/auth/login       # Login
GET  /api/auth/profile     # Get profile
```

### Scans

```http
POST /api/scans/start      # Start new scan
GET  /api/scans/:id        # Get scan results
POST /api/killswitch/stop  # Emergency stop
```

### Reports

```http
GET  /api/reports/:scanId  # Download PDF report
```

### Admin

```http
GET  /api/scan-history/admin-all    # All scans (admin)
GET  /api/scan-history/admin-stats  # Statistics
GET  /api/authorization/all         # All auth requests
GET  /api/authorization/my-requests # User's requests
POST /api/authorization/request     # New auth request
POST /api/authorization/admin-bypass/:id  # Bypass approval
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**theWayCrafter**

- GitHub: [@theWayCrafter](https://github.com/theWayCrafter)

---

<div align="center">

### ⭐ Star this repo if you find it useful!

<p>
  <img src="https://img.shields.io/github/stars/theWayCrafter/masai?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/theWayCrafter/masai?style=social" alt="Forks"/>
</p>

**Built with ❤️ for the security community**

</div>
