const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get tour by id
    const tour = await Tour.findById(req.params.tourId);

    // 2) Check if tour is not exists return error
    if (!tour)
        return next(new AppError('Tour are you booking is not exists', 400));

    // 3) If everything is okay create stripe session
    const DOMAIN = `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        // success_url: `${DOMAIN}?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${DOMAIN}/my-tours?alert=booking`,
        cancel_url: `${DOMAIN}/tours/${req.params.tourId}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`${DOMAIN}/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1,
            },
        ],
    });

    res.status(200).json({
        status: 'success',
        session,
    });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const { tour, user, price } = req.query;

//     if (!tour && !user && !price) return next();

//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
    try {
        const user = (await User.findOne({ email: session.customer_email })).id;
        const tour = session.client_reference_id;
        const price = session.display_items[0].amount / 100;

        if (!tour && !user && !price) return;

        Booking.create({ tour, user, price });
    } catch (err) {
        console.log(err);
    }
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            createBookingCheckout(session);
            // Then define and call a function to handle the event checkout.session.completed
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

exports.parseParamsToQuery = (req, res, next) => {
    if (req.params.tourId) req.query.tour = req.params.tourId;
    if (req.params.userId) req.query.user = req.params.userId;
    next();
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getBookings = factory.getMany(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
