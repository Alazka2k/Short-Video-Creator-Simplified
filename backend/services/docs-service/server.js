const express = require('express');
const path = require('path');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.DOCS_SERVICE_PORT || 4000;

// Serve static files from Docusaurus build
app.use('/docs', express.static(path.join(__dirname, '../../../docs-site/build')));

// Handle all routes for SPA
app.get('/docs/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../docs-site/build/index.html'));
});

// Redirect root to docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Documentation service error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  logger.info(`Documentation service running on port ${PORT}`);
  logger.info(`Documentation available at http://localhost:${PORT}/docs`);
}); 