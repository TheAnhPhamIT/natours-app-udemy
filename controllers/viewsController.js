const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const setCSPRes = (res) => {
    res.set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com http://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    );
};

exports.alerts = (req, res, next) => {
    if (req.query.alert === 'booking') {
        req.locals.alert =
            "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.";
    }

    next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();
    // 2) Build template
    // 3) Render that template using data tour from 1)

    setCSPRes(res);
    res.status(200).render('overview', {
        title: 'All tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get tour data (including guides and reviews)
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate(
        'reviews',
        'user rating review -tour'
    );

    if (!tour) return next(new AppError('No tour found with that name', 404));

    // 2) Build template
    // 3) Render that template using data from 1)
    setCSPRes(res);
    res.status(200)
        // .set(
        //     'Content-Security-Policy',
        //     "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        // )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour,
        });
});

exports.login = (req, res, next) => {
    setCSPRes(res);
    res.status(200).render('login', { title: 'Login' });
};

exports.getAccount = (req, res, next) => {
    setCSPRes(res);
    res.status(200).render('account', { title: 'Me' });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    setCSPRes(res);
    res.status(200).render('account', {
        title: 'Me',
        user: updatedUser,
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    // Get bookings by user id;
    const bookings = await Booking.find({ user: req.user.id });
    console.log(bookings);

    // Get tours by tourIds
    const tourIds = bookings.map((booking) => booking.tour.id);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    setCSPRes(res);
    res.status(200).render('overview', {
        title: 'My tours',
        tours,
    });
});
