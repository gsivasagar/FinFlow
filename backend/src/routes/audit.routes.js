const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getAuditLogs } = require('../controllers/audit.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAuditLogs);

module.exports = router;
