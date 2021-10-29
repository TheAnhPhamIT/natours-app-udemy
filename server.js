const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! Shuting down');
    console.log(err.name, err.message);
    console.log(err);
    process.exit(1);
});

dotenv.config({ path: './config.env' });

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

const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`server is running on port: ${port}`);
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shuting down');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
