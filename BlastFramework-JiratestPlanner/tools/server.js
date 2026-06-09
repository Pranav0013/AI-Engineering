require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');

const configRoutes = require('./routes/config');
const jiraRoutes = require('./routes/jira');
const testplanRoutes = require('./routes/testplan');
const analyzeRoutes = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/config', configRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/testplan', testplanRoutes);
app.use('/api/testplan', analyzeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
