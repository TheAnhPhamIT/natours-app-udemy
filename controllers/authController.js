const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Email = require('./../utils/email');
const crypto = require('crypto');

const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken({ id: user._id });
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signIn = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    await new Email(
        newUser,
        `${req.protocol}://${req.get('host')}/me`
    ).sendWelcome();

    const token = signToken({ id: newUser._id });

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser,
        },
    });
});

exports.logIn = catchAsync(async (req, res, next) => {
    // 1) Check if email and password is exists
    const { password, email } = req.body;

    if (!email || !password)
        return next(
            new AppError('Please provide us your email and password', 400)
        );

    // 2) Check user is exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Username or password is incorrect', 400));
    }

    // 3) If everything is okay, send token to client
    const token = signToken({ id: user._id });

    // 4) Optional: Send ACCESS_TOKEN in cookie
    const cookieOptions = {
        expires: new Date(
            Date.now() +
                +process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.environment === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
        status: 'success',
        token,
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;

    const { authorization } = req.headers;
    if (authorization && authorization.startsWith('Bearer')) {
        token = authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token)
        return next(
            new AppError(
                'You are not logged in! Please login to get access',
                400
            )
        );

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser)
        return next(
            new AppError(
                'User belonging to this token does no longer exist',
                400
            )
        );

    // 4) Check if user changed password after the JWT was issued
    if (currentUser.passwordChangedAfter(decoded.iat))
        return next(
            new AppError(
                'User recently changed password! Please login again',
                400
            )
        );

    // 5) If everything is okay, assign currentUser into the req and go to next
    res.locals.user = currentUser;
    req.user = currentUser;
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // Verification token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // Check if user still exists
            const currentUser = await User.findById(decoded.id);

            if (!currentUser) return next();

            // Check if user changed password after the JWT was issued
            if (currentUser.passwordChangedAfter(decoded.iat)) return next();

            // If everything is okay, assign currentUser into the req and go to next middleware
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }

    next();
};

exports.logoutForWeb = (req, res, next) => {
    const cookieOptions = {
        expires: new Date(Date.now() + 1 * 1000),
        httpOnly: true,
    };

    res.cookie('jwt', 'loggedout', cookieOptions);

    res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (roles.indexOf(req.user.role) === -1)
            return next(
                new AppError(
                    `You don't have permission to perform this action`,
                    403
                )
            );
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user)
        return next(
            new AppError('There is no user with this email address!', 400)
        );
    // 2) Generate reset token
    const resetToken = user.generatePasswordResetToken();

    await user.save({ validateBeforeSave: false });

    // 3) Send it back to user's email
    try {
        const resetUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/resetPassword/${resetToken}`;

        await new Email(user, resetUrl).sendResetPassword();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('Error sending email! Please try again later', 500)
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user)
        return next(
            new AppError('This reset token is invalid or has expired', 400)
        );

    // 2) If user is exist and the token has not yet expires, change the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    // 3) update changedPasswordAt property for the user
    // 4) Log the user in and send token back to client
    const token = signToken({ id: user.id });

    res.status(200).json({
        status: 'success',
        token,
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return next(new AppError('There is no user with this ID', 400));

    // 2) Check if POSTed current password is correct
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    if (!(await user.correctPassword(currentPassword, user.password)))
        return next(
            new AppError('Current password is wrong! Please try again', 401)
        );
    // 3) If so, update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    createSendToken(user, 200, res);
});
