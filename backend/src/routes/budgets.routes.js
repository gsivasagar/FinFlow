const express = require('express');
const router = express.Router();
const { getBudgets, setBudget, deleteBudget } = require('../controllers/budgets.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { setBudgetSchema } = require('../schemas');

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', validate(setBudgetSchema), setBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
