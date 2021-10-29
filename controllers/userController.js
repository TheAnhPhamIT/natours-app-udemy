const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
const sharp = require('sharp');
const multer = require('multer');

const filterObj = (obj, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(obj).forEach((key) => {
        if (allowedFields.includes(key)) filteredObj[key] = obj[key];
    });

    return filteredObj;
};

// For storage on disk without resize
// const multerStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/img/users/');
//     },
//     filename: function (req, file, cb) {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//     },
// });

// For resize image
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) return cb(null, true);
    cb(new AppError('Not an image! Please upload only image', 400), false);
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    req.file.filename = filename;

    await sharp(req.file.buffer)
        .resize({ width: 500, height: 500 })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${filename}`);

    next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm)
        return next(
            new AppError(
                `You can't update password in this route, Please use route: /updateMyPassword`,
                400
            )
        );

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            runValidators: true,
            new: true,
        }
    );

    res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
    });
});

exports.aliasMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);
exports.getUsers = factory.getMany(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
