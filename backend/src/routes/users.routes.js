const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { updateRoleSchema, updateStatusSchema } = require('../schemas');
const { getAllUsers, updateUserRole, updateUserStatus } = require('../controllers/users.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAllUsers);
router.patch('/:id/role', validate(updateRoleSchema), updateUserRole);
router.patch('/:id/status', validate(updateStatusSchema), updateUserStatus);

module.exports = router;
