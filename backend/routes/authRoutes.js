const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/auth/login', authController.login);
router.post('/auth/login-firebase', authController.loginFirebase);
router.post('/auth/signup', authController.signup);
router.get('/auth/profile', auth, authController.getProfile);
router.put('/auth/profile', auth, authController.updateProfile);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-email-request', auth, authController.changeEmailRequest);
router.post('/auth/change-email-confirm', auth, authController.changeEmailConfirm);
router.post('/auth/change-email-firebase', auth, authController.changeEmailFirebase);
router.post('/auth/reset-password-settings', auth, authController.resetPasswordSettings);

module.exports = router;
