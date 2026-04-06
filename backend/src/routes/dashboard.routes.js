const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getSummary } = require('../controllers/dashboard.controller');

router.use(authenticate);
router.use(authorize('analyst', 'admin'));

router.get('/summary', getSummary);

module.exports = router;
