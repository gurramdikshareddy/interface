// Create folder: api/
// Inside create: index.js
// Location: /api/index.js

const app = require('../server');
module.exports = (req, res) => app(req, res);