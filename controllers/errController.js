const AppError = require('./../utils/appError');

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
};

const handleTokenExpired = () => {
    return new AppError(
        'Token is expired! Please login again to get new access token!',
        400
    );
};

const handleTokenError = () => {
    return new AppError(
        'Token is invalid! Please login again to get new access token!',
        400
    );
};

const sendErrDev = (err, req, res) => {
    // For api
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack,
        });
    }

    // For web
    console.log(err);
    res.status(err.statusCode).render('error', {
        title: 'There are something wrong!',
        msg: err.message,
    });
};

const sendErrProd = (err, req, res) => {
    // For api
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }

        // Programing or other unknown error: don't leak error details
        // 1) Log error
        console.error(err);

        // 2) Send generic error
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong',
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'There are something wrong',
            msg: err.message,
        });
    }

    // Programing or other unknown error: don't leak error details
    // 1) Log error
    console.error(err);

    // 2) Send generic error
    return res.status(err.statusCode).render('error', {
        title: 'There are something wrong',
        msg: 'Please try again later',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (err.name === 'CastError') error = handleCastError(err);

        if (err.code === 11000) error = handleDuplicateFieldsDB(err);

        if (err.name === 'TokenExpiredError') error = handleTokenExpired();

        if (err.name === 'JsonWebTokenError') error = handleTokenError();

        sendErrProd(error, req, res);
    }
};
