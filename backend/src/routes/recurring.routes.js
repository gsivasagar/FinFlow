const express = require('express');
const router = express.Router();
const { getRecurring, createRecurring, deleteRecurring, toggleRecurring } = require('../controllers/recurring.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createRecurringSchema } = require('../schemas');

router.use(authenticate);

// We limit creating/toggling recurring transactions to admin and analyst
router.get('/', getRecurring);
router.post('/', authorize('admin', 'analyst'), validate(createRecurringSchema), createRecurring);
router.delete('/:id', authorize('admin', 'analyst'), deleteRecurring);
router.patch('/:id/toggle', authorize('admin', 'analyst'), toggleRecurring);

module.exports = router;
