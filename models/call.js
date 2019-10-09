var mongoose = require('mongoose');

var CallSchema = new mongoose.Schema({
    route: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE"],
        required: true
    },
    accesses: [{
        type: {
            type: String,
            enum: ["User", "Chave"],
            required: true
        },
        id: {
            type: String,
            required: true
        },
        nCalls: {
            type: Number,
            required: true,
            default: 0
        }
    }]
});

module.exports = mongoose.model('Call', CallSchema, 'calls');
