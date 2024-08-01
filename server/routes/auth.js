const express = require('express');
const authContoller = require('../controllers/auth');

const router = express.Router();

// router.post('/register', authContoller.register);

router.post('/login', authContoller.login);

router.get('/logout',authContoller.logout);

module.exports = router;