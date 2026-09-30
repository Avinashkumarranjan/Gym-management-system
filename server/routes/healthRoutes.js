const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: 'FitCore API is running',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

module.exports = router;
