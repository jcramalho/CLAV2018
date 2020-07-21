var mongoose = require('mongoose');
var vcTipoUser = require('../routes/validation').vcTipoUser
var vcVerbo = require('../routes/validation').vcVerbo

var LogSchema = new mongoose.Schema({
    route: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: vcVerbo,
        required: true
    },
    type: {
        type: String,
        enum: vcTipoUser,
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
