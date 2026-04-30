const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3015;
const HETZNER_API_KEY = process.env.HETZNER_API_KEY;

app.use(cors());
app.use(express.json());

async function getAgentMetrics(serverIp) {
    try {
        const agentUrl = `http://${serverIp}:9100/metrics`;
        const response = await axios.get(agentUrl, { timeout: 2000 });
        const metricsText = response.data;    
        const metrics = {};
        const parseMetric = (regex) => {
            const match = metricsText.match(regex);
            return match ? parseFloat(match[1]) : null;
        };

        const totalMem = parseMetric(/^node_memory_MemTotal_bytes\s+(.*)/m);
        const availableMem = parseMetric(/^node_memory_MemAvailable_bytes\s+(.*)/m);
        if (totalMem !== null && availableMem !== null) {
            metrics.ram = { total: totalMem, available: availableMem };
        }

        const load1 = parseMetric(/^node_load1\s+(.*)/m);
        const load5 = parseMetric(/^node_load5\s+(.*)/m);
        const load15 = parseMetric(/^node_load15\s+(.*)/m);
        if (load1 !== null && load5 !== null && load15 !== null) {
            metrics.load = { load1, load5, load15 };
        }

        return metrics;
    } catch (error) {
        console.warn(`Could not connect to node_exporter on ${serverIp}:9100. Is it installed and running?`);
        return {};
    }
}

app.get('/api/metrics', async (req, res) => {
    if (!HETZNER_API_KEY) {
        return res.status(500).json({ message: 'HETZNER_API_KEY is not set on the server.' });
    }

    try {
        const serversResponse = await axios.get('https://api.hetzner.cloud/v1/servers', {
            headers: { 'Authorization': `Bearer ${HETZNER_API_KEY}` }
        });

        if (!serversResponse.data.servers || serversResponse.data.servers.length === 0) {
            return res.status(404).json({ message: 'No servers found in this project.' });
        }
        const server = serversResponse.data.servers[0];

        const agentMetricsPromise = getAgentMetrics(server.public_net.ipv4.ip);
        const end = new Date();
        const start = new Date(end.getTime() - 60 * 60 * 1000);
        const types = 'cpu,disk,network';
        const metricsUrl = `https://api.hetzner.cloud/v1/servers/${server.id}/metrics?type=${types}&start=${start.toISOString()}&end=${end.toISOString()}`;            
        const apiMetricsPromise = axios.get(metricsUrl, {
            headers: { 'Authorization': `Bearer ${HETZNER_API_KEY}` }
        });

        const [agentMetrics, apiMetricsResponse] = await Promise.all([agentMetricsPromise, apiMetricsPromise]);

        res.json({
            server: { id: server.id, name: server.name },
            metrics: apiMetricsResponse.data.metrics,
            agentMetrics: agentMetrics
        });

    } catch (error) {
        console.error('Error during API fetch:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to fetch data from Hetzner API. Check server logs.' });
    }
});
app.use(express.static(path.join(__dirname)));
app.listen(port, () => {
    console.log(`Hetzner metrics server listening at http://localhost:${port}`);
    console.info(`Make sure to set the HETZNER_API_KEY environment variable.`);
});
