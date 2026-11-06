# 🚀 EKMK Family Tree Deployment & Port Forwarding Guide

This document describes the complete production deployment setup for the **EKMK Family Tree Heritage & Admin Platform** on the local server and how to configure port forwarding for worldwide internet access.

---

## 🌐 Network & Infrastructure Overview

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Server Local IP** | `192.168.1.70` | Internal LAN IP of the target machine (`ssb-OptiPlex-3010`) |
| **Static Public IP** | `136.185.1.251` | Your WAN Static Public IP from ISP |
| **SSH User** | `ssb` | SSH key configured for passwordless login |
| **Target Directory** | `/home/ssb/Family-Tree-EKMK` | Application directory on the server |
| **Spring Boot Backend Port**| `8086` | Internal service port (PostgreSQL DB: `kmk-family`) |
| **Nginx Web Server** | Ports `7300` & `7301` | High-performance reverse proxy & static file server |

---

## 🔀 Port Forwarding Rules for Your Router

To access your applications from anywhere in the world using your static IP **`136.185.1.251`**, log in to your ISP Router / Gateway settings (typically at `http://192.168.1.1` or `http://192.168.1.254`) and configure the following **Port Forwarding (Virtual Server / NAT)** rules:

| Application | External (WAN) Port | Internal (LAN) Port | Internal IP Address | Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Public Family Tree Website** | **`7300`** | **`7300`** | `192.168.1.70` | TCP |
| **Admin Management Portal** | **`7301`** | **`7301`** | `192.168.1.70` | TCP |
| *(Optional)* Alternative Frontend | `5173` | `5173` | `192.168.1.70` | TCP |
| *(Optional)* Alternative Admin | `5174` | `5174` | `192.168.1.70` | TCP |

> [!NOTE]
> **Why is port 8086 NOT exposed externally?**
> Nginx proxies all `/api/` calls directly inside the server (`http://127.0.0.1:8086`). This eliminates CORS issues and keeps the backend secure behind Nginx without needing to open extra ports to the public internet.

---

## 🌍 Access URLs

### 1. After Port Forwarding is Activated (Access from Anywhere in the World)
- **Public Family Website & Tree**:
  👉 **`http://136.185.1.251:7300`**
- **Admin Management Portal**:
  👉 **`http://136.185.1.251:7301`**
- **Backend API Health Check**:
  👉 **`http://136.185.1.251:7300/api/admin/health`**

### 2. Local Network Access (Wi-Fi / LAN inside the house/office)
- **Public Family Website & Tree**:
  👉 `http://192.168.1.70:7300` (or `http://192.168.1.70:5173`)
- **Admin Management Portal**:
  👉 `http://192.168.1.70:7301` (or `http://192.168.1.70:5174`)

---

## 🛠️ Server Architecture Components

### 1. Spring Boot Backend Systemd Service
The backend runs continuously as an automatic system service:
- **Service Name**: `familytree-backend.service`
- **Location**: `/etc/systemd/system/familytree-backend.service`
- **JAR Path**: `/home/ssb/Family-Tree-EKMK/backend/familytree-backend.jar`
- **Configuration**: `/home/ssb/Family-Tree-EKMK/backend/application-prod.properties`
- **Port**: `8086`

Commands to manage the service on the server:
```bash
# Check service status
sudo systemctl status familytree-backend.service

# Restart the service
sudo systemctl restart familytree-backend.service

# The family website password is set and changed in the admin site:
#   Share the link -> Family website password -> Change the password -> Save.
# No server commands are needed. Optionally, a starting password can be given to the
# service (used only until the admin sets one in the admin site):
#   sudo systemctl edit familytree-backend.service   ->   [Service] Environment="FAMILY_PASSWORD=..."

# View live service logs
journalctl -u familytree-backend.service -f
```

### 2. Nginx Reverse Proxy Configuration
- **Site File**: `/etc/nginx/sites-available/ekmk-family` (symlinked into `/etc/nginx/sites-enabled/`)
- **Frontend Dist Root**: `/home/ssb/Family-Tree-EKMK/frontend/dist`
- **Admin Dist Root**: `/home/ssb/Family-Tree-EKMK/admin/dist`
- **API Proxy**: All requests to `/api/` are forwarded internally to `http://127.0.0.1:8086/`
- **Upload Limit**: `client_max_body_size 50M;` for high-resolution family photos
- **Client address**: keep `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` in the `/api/` block. The wrong-password pause counts tries per phone from this header; without it every visitor shares one counter.

To test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. PostgreSQL Database
- **Host**: `localhost:5432`
- **Database**: `kmk-family`
- **User**: `postgres`
- **Password**: `postgres`
- Auto-starts on server reboot.

### 4. Uploads Directory
- **Path**: `/home/ssb/Family-Tree-EKMK/uploads/photos`
- Photos uploaded via Admin are stored here and served through the `/api/media/photos/{filename}` endpoint.

---

## ⚡ How to Deploy Updates (One-Click Deploy)

Whenever you make code changes locally on your development machine, you can build and deploy everything to the server with a single command:

```bash
./deploy-to-server.sh
```

What this script does automatically:
1. Compiles the latest Spring Boot JAR (`backend/build/libs/backend-0.0.1-SNAPSHOT.jar`).
2. Builds the optimized production bundles for Frontend and Admin.
3. Syncs the JAR, static assets, and configurations to `/home/ssb/Family-Tree-EKMK/` on `192.168.1.70`.
4. Restarts `familytree-backend.service` and reloads Nginx cleanly without downtime.

---

## 🔍 Useful Maintenance Commands

Run these on the server via SSH: `ssh ssb@192.168.1.70`

```bash
# Quick status check of all Family Tree services & ports
/home/ssb/Family-Tree-EKMK/scripts/status.sh

# Restart both backend and Nginx
/home/ssb/Family-Tree-EKMK/scripts/restart.sh

# Watch backend logs in real time
/home/ssb/Family-Tree-EKMK/scripts/logs.sh

# Database Backup
PGPASSWORD=postgres pg_dump -h localhost -U postgres -d kmk-family -f /home/ssb/Family-Tree-EKMK/backup_$(date +%F).sql
```
