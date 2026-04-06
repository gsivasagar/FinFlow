const express = require('express');
const router = express.Router();
const { register, login, logout, me, forgotPassword, resetPassword, updateProfile, updatePassword } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, updatePasswordSchema } = require('../schemas');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Profile routes
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/password', authenticate, validate(updatePasswordSchema), updatePassword);

module.exports = router;
