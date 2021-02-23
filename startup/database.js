const mongoose = require('mongoose');
const { consoleLogger, fileLogger } = require('../utils/logger');

init = () => {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true})
    .then(() => {
        fileLogger.info("Connected to mongoDB")
    }).catch(() => {
        fileLogger.error("Could not connect to mongoDB")
    });
}

module.exports = { init };