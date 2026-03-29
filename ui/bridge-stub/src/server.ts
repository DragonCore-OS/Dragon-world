import express from 'express';
import agentRespondRouter from './routes/agentRespond.js';
import memoryPanelRouter from './routes/memoryPanel.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// CORS for local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-World-Version, X-Request-ID');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(agentRespondRouter);
app.use(memoryPanelRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dragonworld-bridge-stub' });
});

app.listen(PORT, () => {
  console.log(`[stub] DragonWorld Bridge Stub Server running on http://localhost:${PORT}`);
  console.log(`[stub] Endpoints:`);
  console.log(`  POST /v1/agent/respond`);
  console.log(`  POST /v1/memory/panel`);
  console.log(`  GET  /health`);
});
