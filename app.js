const express = require('express');
const morgan = require('morgan');
const path = require('path');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const bookingController = require('./controllers/bookingController');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const app = express();

app.enable('trust proxy');

//1) GLOBAL MIDDLEWARES
// Implement cors
app.use(cors());

app.options('*', cors());

// Serving static file
app.use(express.static(path.join(__dirname, 'public')));

// Setup View
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Set security HTTP header
app.use(helmet());

// Development logging
if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP! Please try again in a hour',
});

app.use('/api', limiter);

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post(
    '/api/v1/bookings/webhook-checkout',
    express.raw({ type: 'application/json' }),
    bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attack
app.use(xss());

// Compression res bodies
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.get('user-agent'));
    next();
});

//2) FOR ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use('/', viewsRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
