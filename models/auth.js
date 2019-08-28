var mongoose = require('mongoose');

// Auth Schema
var AuthCallSchema = mongoose.Schema({
	_id: {},
	url: {}
});

var AuthCall = module.exports = mongoose.model('AuthCall', AuthCallSchema, 'authcalls');
