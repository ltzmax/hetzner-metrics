# Hetzner Server Status Dashboard

A real-time monitoring dashboard that combines official Hetzner Cloud API data with deep-system metrics (RAM, Load) via Prometheus Node Exporter.

---

## 🛠️ Project Structure
*   `index.html`: The frontend dashboard using Tailwind CSS and Chart.js.
*   `server.js`: The Node.js backend that acts as a proxy between your browser, the Hetzner API, and your server.

---

## ⚙️ Prerequisites
1.  **Hetzner API Token:** Generate a "Read & Write" token in your Hetzner Cloud Console under **Security > API Tokens**.
2.  **Node.js:** Ensure Node.js is installed on your local machine or dashboard host.
3.  **Node Exporter:** To see RAM and Load metrics, the target server must have `prometheus-node-exporter` installed.

---

### Installation & Setup

### 1. Install Node Exporter (On the target Hetzner Server)
Connect to your Hetzner Cloud Server via SSH and run:
```bash
sudo apt update && sudo apt install prometheus-node-exporter -y
# The agent will now run on port 9100
```

### 2. Configure Firewall
Ensure port 9100 is open on your Hetzner Cloud Firewall for the IP address where the dashboard is running.

### 3. Install Dashboard Dependencies (On the Dashboard Host)

In the folder containing server.js, run:
```bash
npm install express axios cors
```

### 4. Set Environment Variable & Start

You must provide your API key to the environment so server.js can access it.  

Linux / macOS:
```bash
export HETZNER_API_KEY="your_actual_api_token_here"
node server.js
```
Windows powershell
```bash
$env:HETZNER_API_KEY="your_actual_api_token_here"
node server.js
```
---
### Usage

Once the server starts, you will see: Hetzner metrics server listening at http://localhost:3015.  

1. Open your browser to http://localhost:3015.
2. The dashboard will automatically fetch the first server found in your Hetzner project.
3. Hetzner API Metrics: CPU, Disk IOPS, Disk Throughput, and Network Traffic will populate immediately.  
4. Agent Metrics: RAM Usage and Load Average will populate once the server successfully connects to the Node Exporter agent on port 9100. Charts refresh automatically every 60 seconds.

---
### Troubleshooting
- "HETZNER_API_KEY is not set": You didn't export the environment variable correctly before running node server.js
- "Waiting for agent data": The dashboard cannot reach port 9100 on your server IP. Check your firewall settings.
