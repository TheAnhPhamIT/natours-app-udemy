const fs = require('fs');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//     const tourFound = tours.find((tour) => tour.id == val);
//     if (!tourFound) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Item not found',
//         });
//     }

//     next();
// };

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) return cb(null, true);
    cb(new AppError('Not an image! Please upload only image', 400), false);
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files) return next();
    // resize cover image;
    if (req.files.imageCover) {
        req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

        await sharp(req.files.imageCover[0].buffer)
            .resize({ width: 2000, height: 1333 })
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${req.body.imageCover}`);
    }

    if (req.files.images) {
        req.body.images = await Promise.all(
            req.files.images.map(async (file, idx) => {
                const filename = `tour-${
                    req.params.id
                }-${Date.now()}-${idx}.jpeg`;

                await sharp(file.buffer)
                    .resize({ width: 2000, height: 1333 })
                    .toFormat('jpeg')
                    .jpeg({ quality: 90 })
                    .toFile(`public/img/tours/${filename}`);

                return filename;
            })
        );
    }

    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.page = '1';
    req.query.sort = '-ratingsAverage';
    req.query.fields = 'name,ratingsAverage,price,summary';

    next();
};

exports.checkBodyData = (req, res, next) => {
    const { body } = req;
    const checkProps = ['name', 'price'];
    const isValid = checkProps.every((propName) => propName in body);
    if (!isValid) {
        return res.status(400).json({
            status: 'fail',
            message: 'Bad request! missing name and price in body data',
        });
    }

    next();
};

// exports.getTours = catchAsync(async (req, res, next) => {
//     // Execute query
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .pagination();

//     const tours = await features.query;

//     // Send response
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours,
//         },
//     });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//     const { body } = req;

//     const newTour = await Tour.create(body);

//     res.status(201).json({
//         status: 'success',
//         data: { tour: newTour },
//     });
//     // const newId = tours[tours.length - 1].id + 1;
//     // const newTour = Object.assign({ id: newId }, req.body);

//     // tours.push(newTour);

//     // fs.writeFile(
//     //     `${__dirname}/../dev-data/data/tours-simple.json`,
//     //     JSON.stringify(tours),
//     //     (err) => {
//     //         if (err) {
//     //             res.status(500).json({
//     //                 status: 'fail',
//     //                 message: `Can't create new tour, some error happen`,
//     //             });
//     //         } else {
//     //             res.status(201).json({
//     //                 status: 'success',
//     //                 data: {
//     //                     tour: newTour,
//     //                 },
//     //             });
//     //         }
//     //     }
//     // );
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//     const { id } = req.params;

//     const tour = await Tour.findById(id).populate('reviews');

//     if (!tour) return next(new AppError('No tour found with that ID', 404));

//     res.status(200).json({
//         status: 'success',
//         data: { tour },
//     });
//     // const { id } = req.params;
//     // const tourFound = tours.find((tour) => tour.id == id);
//     // res.status(200).json({
//     //     status: 'success',
//     //     data: {
//     //         tour: tourFound,
//     //     },
//     // });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const { id } = req.params;
//     const tour = await Tour.findByIdAndUpdate(id, req.body, {
//         new: true,
//         runValidators: true,
//     });

//     if (!tour) return next(new AppError('Not tour found with that ID', 404));

//     res.status(200).json({
//         status: 'success',
//         data: { tour },
//     });
//     // const { id } = req.params;
//     // const tourFound = tours.find((tour) => tour.id == id);

//     // Object.assign(tourFound, req.body);
//     // fs.writeFile(
//     //     `${__dirname}/../dev-data/data/tours-simple.json`,
//     //     JSON.stringify(tours),
//     //     (err) => {
//     //         if (err) {
//     //             res.status(500).json({
//     //                 status: 'fail',
//     //                 message: `Can't create new tour, some error happen`,
//     //             });
//     //         } else {
//     //             res.status(201).json({
//     //                 status: 'success',
//     //                 data: {
//     //                     tour: tourFound,
//     //                 },
//     //             });
//     //         }
//     //     }
//     // );
// });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTours = factory.getMany(Tour);

exports.getTour = factory.getOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.5 } } },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        // { $match: { _id: { $ne: 'EASY' } } },
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const { year } = req.params;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $project: { _id: 0 },
        },
        {
            $sort: { numTours: -1 },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: { plan },
    });
});

//'/toursWithin/:distance/center/:latlng/unit/:unit',
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        return next(
            new AppError(
                'Please provide latitude and longitude in format lat,lng'
            )
        );
    }

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                name: 1,
                distance: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances,
        },
    });
});
