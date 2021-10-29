const express = require('express');
const viewsController = require('../controllers/viewsController');
// const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
    '/',
    // bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewsController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// Login
router.get('/login', authController.isLoggedIn, viewsController.login);

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/me/my-tours', authController.protect, viewsController.getMyTours);

router.post(
    '/update-user-data',
    authController.protect,
    viewsController.updateUserData
);

module.exports = router;
