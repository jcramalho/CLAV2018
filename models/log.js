var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
    route: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE"],
        required: true
    },
    type: {
        type: String,
        enum: ["User", "Chave"],
        required: true
    },
    id: {
        type: String,
        required: true
    },
    httpStatus: {
        type: Number,
        required: true
    },
    accessDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Log', LogSchema, 'logs');
