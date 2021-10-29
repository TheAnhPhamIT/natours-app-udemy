const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty'],
        },
        rating: {
            type: Number,
            min: [1, 'A review rating must have above 1'],
            max: [5, 'A review rating must have below 5'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must created by a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        { $match: { tour: tourId } },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].avgRating,
        ratingsQuantity: stats[0].nRating,
    });
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this._reviewInstance = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, function () {
    this._reviewInstance.constructor.calcAverageRatings(
        this._reviewInstance.tour
    );
});

reviewSchema.pre(/^find/, function (next) {
    // this.populate([
    //     { path: 'user', select: '-__v -passwordChangedAt' },
    //     { path: 'tour', select: '-__v' },
    // ]);
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    // .populate({
    //     path: 'tour',
    //     select: 'name',
    // });
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
