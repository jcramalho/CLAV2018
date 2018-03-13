var mongo = require('mongodb');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

var db = mongoose.connection;

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
	local: {
		password: {
			type: String
		}
	},
	/*
		facebook: {
			id: {
				type: String
			},
			token: {
				type: String
			}
		},
		google: {
			id: {
				type: String
			},
			token: {
				type: String
			}
		},
	*/
	savedStates: {
		escolhaProcessos: {
			tipologias: {
				type: Array
			},
			comuns: {
				type: Array
			},
			especificos: {
				type: Array
			},
			restantes: {
				type: Array
			},
		}
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
	bcrypt.genSalt(10, function (err, salt) {
		bcrypt.hash(newUser.local.password, salt, function (err, hash) {
			newUser.local.password = hash;
			newUser.save(callback);
		});
	});
}

module.exports.getUserByEmail = function (email, callback) {
	var query = { email: email };
	User.findOne(query, callback);
}

module.exports.getUserByCC = function (cc, callback) {
	var query = { cc: cc };
	User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
	User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		if (err) throw err;
		callback(null, isMatch);
	});
}