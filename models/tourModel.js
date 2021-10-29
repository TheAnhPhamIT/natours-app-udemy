const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

const tourSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            maxlength: [
                50,
                'A tour name must have less or equal 50 characters',
            ],
            minlength: [
                10,
                'A tour name must have greater or equal 10 characters',
            ],
            trim: true,
            unique: true,
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult',
            },
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                // this only valid when create document
                validator: function (val) {
                    return val < this.price;
                },
                message:
                    'Price discount ({VALUE}) must have lower than regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'A tour ratings average must have above 1'],
            max: [5, 'A tour ratings average must have below 5'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        images: [String],
        startDates: [Date],
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        // guides: Array,
        guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Document virtual
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// Document index
tourSchema.index({ startLocation: '2dsphere' });

// Document middleware
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function (next) {
//     const userPromises = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(userPromises);
//     next();
// });

// tourSchema.pre('save', function (next) {
//     console.log('document middleware');
//     next();
// });

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });

// Query middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

// tourSchema.post(/^find/, function (docs, next) {
//     console.log(`This query take ${Date.now() - this.start} ms!`);
//     next();
// });

// Aggregate middleware
tourSchema.pre('aggregate', function (next) {
    if (this.pipeline()[0] && !this.pipeline()[0]['$geoNear']) {
        this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    }
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
