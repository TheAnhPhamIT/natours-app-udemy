const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');

exports.aliasCreateTour = (req, res, next) => {
    req.body.user = req.user._id;
    next();
};

exports.getReviews = catchAsync(async (req, res, next) => {
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;

    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        data: { reviews },
    });
});

exports.createReview = catchAsync(async (req, res, next) => {
    // Alow created review in nested route
    if (!req.body.tour) req.body.tour = req.params.tourId;

    if (!req.body.user) req.body.user = req.user._id;

    // check user are actually booked tour
    const booking = await Booking.findOne({
        tour: req.body.tour,
        user: req.body.user,
    });

    if (!booking)
        return next(
            new AppError(
                `You cannot review this tour because you have never booked this tour`,
                404
            )
        );

    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { review: newReview },
    });
});

exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
