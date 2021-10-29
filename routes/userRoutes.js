const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const bookingRouter = require('../routes/bookingRoutes');
const express = require('express');

const router = express.Router();

router.use('/:userId/bookings', bookingRouter);

router.route('/signIn').post(authController.signIn);

router.route('/login').post(authController.logIn);

// logout for web
router.route('/logoutForWeb').get(authController.logoutForWeb);

router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);

router
    .route('/updateMe')
    .patch(
        userController.uploadUserPhoto,
        userController.resizeUserPhoto,
        userController.updateMe
    );

router.route('/deleteMe').delete(userController.deleteMe);

router.route('/me').get(userController.aliasMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getUsers).post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
