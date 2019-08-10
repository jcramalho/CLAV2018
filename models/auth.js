var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

// Auth Schema
var AuthCallSchema = mongoose.Schema({
	_id: {},
	url: {}
});

var AuthCall = module.exports = mongoose.model('AuthCall', AuthCallSchema);