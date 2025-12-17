# Aegis AI - Deployment Guide

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- OpenAI API Key

#### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/aegis-ai.git
cd aegis-ai

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
      - POSTGRESQL_URI=${POSTGRESQL_URI}
      - AUTHORIZED_TARGETS=${AUTHORIZED_TARGETS}
    depends_on:
      - mongodb
      - postgresql

  mongodb:
    image: mongo:8.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=aegis

  postgresql:
    image: postgres:15
    ports:
      - "5432:5432"
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=aegis_audit
      - POSTGRES_USER=aegis
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  mongodb_data:
  postgresql_data:
```

---

### Option 2: Kubernetes

#### Prerequisites
- Kubernetes 1.24+
- kubectl configured
- Helm 3.0+ (optional)

#### Deployment Manifests

**1. Create Namespace**
```bash
kubectl create namespace aegis-ai
```

**2. Create Secrets**
```bash
kubectl create secret generic aegis-secrets \
  --from-literal=openai-api-key=$OPENAI_API_KEY \
  --from-literal=postgres-password=$POSTGRES_PASSWORD \
  -n aegis-ai
```

**3. Deploy Database StatefulSets**

```yaml
# mongodb-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: aegis-ai
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:8.0
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: data
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**4. Deploy Application**

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aegis-backend
  namespace: aegis-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aegis-backend
  template:
    metadata:
      labels:
        app: aegis-backend
    spec:
      containers:
      - name: backend
        image: aegis-ai/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: aegis-secrets
              key: openai-api-key
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017/aegis"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

**5. Deploy Services**

```yaml
# services.yaml
apiVersion: v1
kind: Service
metadata:
  name: aegis-frontend
  namespace: aegis-ai
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: aegis-frontend
```

**6. Apply All**
```bash
kubectl apply -f k8s/
kubectl get pods -n aegis-ai
```

---

### Option 3: Manual Deployment

#### System Requirements
- Node.js 18+
- MongoDB 8.0+
- PostgreSQL 15+
- 4GB RAM minimum
- 10GB disk space

#### Installation Steps

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Setup databases
# Start MongoDB
mongod --dbpath /path/to/data

# Initialize PostgreSQL
psql -U postgres
CREATE DATABASE aegis_audit;
CREATE USER aegis WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aegis_audit TO aegis;

# 4. Start services
cd frontend && npm run build && npm start
cd backend && npm run build && npm start
```

---

## 🔐 SSL/TLS Configuration

### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name aegis.example.com;

    ssl_certificate /etc/ssl/certs/aegis.crt;
    ssl_certificate_key /etc/ssl/private/aegis.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📊 Monitoring & Logging

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# Database connections
docker-compose exec backend npm run db:check
```

### Log Aggregation
```bash
# Docker logs
docker-compose logs -f backend

# Kubernetes logs
kubectl logs -f -l app=aegis-backend -n aegis-ai

# Export audit logs
curl http://localhost:3001/api/audit/export
```

---

## 🔄 Scaling Guidelines

### Horizontal Scaling
- Frontend: Stateless, scale up to 10+ replicas
- Backend: Stateless, scale up to 5 replicas
- MongoDB: Use replica sets for HA
- PostgreSQL: Use read replicas

### Resource Recommendations

| Component  | Min | Recommended | Production |
|-----------|-----|-------------|------------|
| Frontend  | 512MB/0.5 CPU | 1GB/1 CPU | 2GB/2 CPU |
| Backend   | 1GB/1 CPU | 2GB/2 CPU | 4GB/4 CPU |
| MongoDB   | 2GB/1 CPU | 4GB/2 CPU | 8GB/4 CPU |
| PostgreSQL| 2GB/1 CPU | 4GB/2 CPU | 8GB/4 CPU |

---

## 🔧 Troubleshooting

### Common Issues

**Q: Frontend can't connect to backend**
```bash
# Check network connectivity
docker-compose exec frontend ping backend

# Verify environment variables
docker-compose exec frontend env | grep API_URL
```

**Q: Database connection errors**
```bash
# Check database status
docker-compose ps mongodb postgresql

# Restart databases
docker-compose restart mongodb postgresql
```

**Q: WebSocket not connecting**
```bash
# Check CORS settings
# Ensure Socket.io is properly configured
# Verify no proxy/firewall blocking WebSocket
```

---

## 🚨 Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Restrict authorized targets
- [ ] Regular security updates
- [ ] Backup encryption at rest

---

## 📦 Backup & Recovery

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/aegis" --out=/backup

# Backup PostgreSQL
pg_dump -U aegis aegis_audit > aegis_audit_backup.sql

# Restore
mongorestore --uri="mongodb://localhost:27017/aegis" /backup
psql -U aegis aegis_audit < aegis_audit_backup.sql
```

---

**Last Updated:** December 17, 2024  
**Status:** Production Ready 🚀
