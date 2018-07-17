var mongo = require('mongodb');
var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

var db = mongoose.connection;

// Trabalho Schema
var TrabalhoSchema = mongoose.Schema({
	tipo: {
        type: String
    },
	userEmail: {
		type: String,
		index: true
    },
    objeto: {
        type: Object
    },
    objetoID: {
        type: String
    },
    data: {
        type: String
    },
});

var Trabalho = module.exports = mongoose.model('Trabalho', TrabalhoSchema);

module.exports.createTrabalho = function (newTrabalho, callback) {
	newTrabalho.save(callback);
}

module.exports.getTrabalhosByEmail = function (email, callback) {
	var query = { userEmail: email };
	Trabalho.find(query, callback);
}
