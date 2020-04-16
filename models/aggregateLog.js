var mongoose = require('mongoose');

var number = {
    type: Number,
    default: 0,
    required: true
}

var date = {
    type: Date,
    default: Date.now,
    required: true
}

var routeSchema = new mongoose.Schema({
    route: {
        type: String,
        required: true
    },
    lastAccess: date,
    nGETs: number,
    nPOSTs: number,
    nPUTs: number,
    nDELETEs: number
}, {_id: false})

var aggregateLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["User", "Chave", "Desconhecido"],
        required: true
    },
    id: {
        type: String,
        required: true
    },
    lastAccess: date,
    routes: [routeSchema],
    nGETs: number,
    nPOSTs: number,
    nPUTs: number,
    nDELETEs: number
});

module.exports = mongoose.model('aggregateLog', aggregateLogSchema, 'aggregateLogs');
