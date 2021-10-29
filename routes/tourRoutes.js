const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');
const bookingRouter = require('../routes/bookingRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router
    .route('/toursWithin/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router
    .route('/distances/center/:latlng/unit/:unit')
    .get(tourController.getDistances);

router
    .route('/')
    .get(authController.protect, tourController.getTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.checkBodyData,
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;
