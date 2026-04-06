const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createRecordSchema, updateRecordSchema } = require('../schemas');
const {
  createRecord, getRecords, updateRecord, deleteRecord
} = require('../controllers/records.controller');
const { exportCSV } = require('../controllers/export.controller');

router.use(authenticate);

router.get('/', authorize('viewer', 'analyst', 'admin'), getRecords);
router.get('/export', authorize('analyst', 'admin'), exportCSV);
router.post('/', authorize('admin'), validate(createRecordSchema), createRecord);
router.put('/:id', authorize('admin'), validate(updateRecordSchema), updateRecord);
router.delete('/:id', authorize('admin'), deleteRecord);

module.exports = router;
