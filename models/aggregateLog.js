var mongoose = require('mongoose');

var aggregateLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["User", "Chave"],
        required: true
    },
    id: {
        type: String,
        required: true
    },
    lastAccess: {
        type: Date,
        default: Date.now,
        required: true
    },
    nGETs: {
        type: Number,
        default: 0,
        required: true
    },
    nPOSTs: {
        type: Number,
        default: 0,
        required: true
    },
    nPUTs: {
        type: Number,
        default: 0,
        required: true
    },
    nDELETEs: {
        type: Number,
        default: 0,
        required: true
    }
});

module.exports = mongoose.model('aggregateLog', aggregateLogSchema, 'aggregateLogs');
