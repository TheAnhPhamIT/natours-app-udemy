const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
const fs = require('fs');
// import { mongoose } from 'mongoose';
// import { dotenv } from 'dotenv';
// import { Tour } from '../../models/tourModel';
// import { fs } from 'fs';

dotenv.config({ path: './config.env' });

// Read data json
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// connect db
const { DB, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;

const uri = DB.replace('<USERNAME>', DB_USERNAME)
    .replace('<PASSWORD>', DB_PASSWORD)
    .replace('<DB_NAME>', DB_NAME);

mongoose
    .connect(uri, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
    })
    .then((con) => {
        console.log('connection successful');
    });

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Imported data successful!');
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Deleted data successful');
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

console.log(process.argv);

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
