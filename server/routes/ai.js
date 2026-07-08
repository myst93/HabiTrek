const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn } = require('../middleware.js');
const aiController = require('../controllers/ai.js');

// POST /api/ai/chat - conversational concierge for guests
router.post('/chat', wrapAsync(aiController.chatConcierge));

// POST /api/ai/enhance - property copywriting enhancement for hosts
router.post('/enhance', isLoggedIn, wrapAsync(aiController.enhanceListing));

module.exports = router;
