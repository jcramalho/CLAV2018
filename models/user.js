var mongoose = require('mongoose');

// User Schema
var UserSchema = mongoose.Schema({
	_id: {
		
	},
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
	nCalls: {
		type: Number,
		default: 0
    },
	local: {
		password: {
			type: String
		}
	}
});

module.exports = mongoose.model('User', UserSchema, 'users');
