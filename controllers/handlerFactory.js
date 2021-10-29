const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) throw new AppError('Not document found with that ID', 404);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const { body } = req;

        const newDoc = await Model.create(body);

        res.status(201).json({
            status: 'success',
            data: { data: newDoc },
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const doc = await Model.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc)
            return next(new AppError('No document found with that ID', 404));

        res.status(200).json({
            status: 'success',
            data: { data: doc },
        });
    });

exports.getOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const { id } = req.params;

        const doc = await Model.findById(id);

        if (!doc)
            return next(new AppError('No document found with that ID', 404));

        res.status(200).json({
            status: 'success',
            data: { data: doc },
        });
    });

exports.getMany = (Model) =>
    catchAsync(async (req, res, next) => {
        // Execute query
        const features = new APIFeatures(Model.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .pagination();

        const docs = await features.query;

        // Send response
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                data: docs,
            },
        });
    });
