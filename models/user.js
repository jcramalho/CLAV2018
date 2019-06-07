var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

// User Schema
var UserSchema = mongoose.Schema({
	internal: {
		type: Boolean,
	},
	level: {
		type: Number,
	},
	permissions: {
		LC: {
			type: Boolean,
		},
		AE: {
			type: Boolean,
		},
		ES: {
			type: Boolean,
		},
	},
	email: {
		type: String,
		index: true
	},
	cc: {
		type: Number,
		index: true
	},
	name: {
		type: String
	},
	entidade: {
		type: String
	},
	local: {
		password: {
			type: String
		}
	}
});

module.exports = mongoose.model('User', UserSchema);