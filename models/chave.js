var mongoose = require('mongoose');

// Chave API Schema
var ChaveSchema = mongoose.Schema({
	key: {
		type: String
    },
    level: {
        type: Number,
        default: 0
    },
    name: {
        type: String
    },
    entity: {
        type: String
    },
	nCalls: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: null
    },
    created: {
        type: Date,
        default: Date.now()
    },
    active: {
        type: Boolean,
        default: true
    },
    contactInfo: {
        type: String
    }
});

module.exports = mongoose.model('Chave', ChaveSchema, 'chaves');
