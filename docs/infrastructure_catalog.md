# Infrastructure Catalog
**Purpose:** Tracks all external tools, services, and dependencies required to run this project - a single source of truth for "what does this project need?"

**Version:** 1.0  
**Last Updated:** DD/MM/YYYY

## Version history
| Version | Date | Changes |
|---------|---------|---------|
| 1.0 | 17/07/2025 | Initial catalog creation |

## Quick start

For installation instructions, see SETUP.md. This catalog documents what exists and why it's needed.

## Storage & disks

| Type | Name | Purpose | Location | Size | Notes |
|------|------|---------|----------|------|-------|
| VHDX | example.vhdx | Primary data | E:\VHDs\ | 50GB | Auto-mount on startup |
| Mount | /mnt/data | VHDX mount point | WSL2 | - | Required for data access |

## Containers

| Name | Image | Purpose | Ports | Start Command | Resources |
|------|-------|---------|-------|---------------|-----------|
| postgres | postgres:15 | Main database | 5432 | docker-compose up -d postgres | 2GB RAM |
| redis | redis:7-alpine | Cache | 6379 | docker-compose up -d redis | 512MB RAM |

## MCP tools

| Tool | Purpose | Config Path | Key Commands | Notes |
|------|---------|-------------|--------------|-------|
| mcp-postgres | Database operations | ~/.config/mcp/postgres.json | query, update | Requires running postgres |

## External APIs

| Service | Purpose | Auth Method | Endpoint | Rate Limits | Cost |
|---------|---------|-------------|----------|-------------|------|
| OpenAI | LLM operations | API Key | api.openai.com | 10k/min | ~$20/mo |

## CLI tools required

| Tool | Min Version | Purpose | Install Command | Verify |
|------|-------------|---------|-----------------|--------|
| docker | 24.0+ | Container runtime | See docker.com | docker --version |
| python | 3.11+ | Runtime | pyenv install 3.11 | python --version |

## System resources

| Resource | Requirement | Purpose | Notes |
|----------|-------------|---------|-------|
| RAM | 16GB minimum | Development + containers | 32GB recommended |
| Disk | 200GB free | Data processing + models | SSD required |
| GPU | CUDA 11.8+ | Model inference | Optional for CPU mode |
| WSL2 | Latest | Linux environment | Windows only |

## Network resources

| Resource | Port/URL | Purpose | Configuration |
|----------|----------|---------|---------------|
| localhost | 3000 | Frontend dev | Vite default |
| localhost | 8000 | API server | FastAPI default |

## Cloud services

| Service | Purpose | Region | Resources | Monthly Cost | Notes |
|---------|---------|--------|-----------|--------------|-------|
| AWS S3 | File storage | us-east-1 | 1 bucket | ~$5 | For backups |

## Environment variables

Key environment variables required (see .env.example for full list):

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| DATABASE_URL | Postgres connection | postgresql://... | Yes |
| OPENAI_API_KEY | LLM access | sk-... | Yes |

## Backup & recovery

| Component | Backup Method | Frequency | Location | Retention |
|-----------|---------------|-----------|----------|-----------|
| Database | pg_dump | Daily | ./backups/db/ | 7 days |
| VHDX | Snapshot | Weekly | E:\Backups\ | 4 weeks |

## Maintenance notes

- Docker images: Update monthly
- Python dependencies: Check for security updates weekly
- VHDX: Defragment monthly if >80% full
- Logs: Rotate when >1GB

## Troubleshooting

Common issues and solutions:

1. **VHDX won't mount**: Check WSL2 is running, restart if needed
2. **Container won't start**: Check port conflicts with `docker ps`
3. **API timeouts**: Verify network connectivity and API keys

---

*Keep this catalog updated as infrastructure changes. It's the first place to look when setting up or debugging the environment.*