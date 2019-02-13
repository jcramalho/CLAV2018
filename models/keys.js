var mongo = require('mongodb');
var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

var db = mongoose.connection;

// User Schema
var KeySchema = mongoose.Schema({
	key: {
		type: String
	},
	nCalls: {
        type: Number
    },
    lastUsed: {
        type: Date
    },
    created: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true,
        required: true
    }
});

var Key = module.exports = mongoose.model('Key', KeySchema);

// module.exports.getKeys = function (callback) {
// 	Key.find({}, callback);
// }

// module.exports.getKeyById = function (id, callback) {
// 	Key.findById(id, callback);
// }

// module.exports.getKeyInfo = function (key, callback) {
// 	var query = { key: key };
// 	Key.findOne(query, callback);
// }