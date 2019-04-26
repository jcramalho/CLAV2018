var mongoose = require('mongoose');
var dataBases = require('../config/database');
var secretKey = require('./../config/app');
var jwt = require('jsonwebtoken');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});


// User Schema
var KeySchema = mongoose.Schema({
    _id: {
        
    },
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
    },
    contactInfo: {
        type: String
    }
});

var Key = module.exports = mongoose.model('Key', KeySchema);

module.exports.generateServerKey = function () {
	var token = jwt.sign({}, secretKey.key);
    var newKey = new Key({
        _id: 'serverKey',
        key: token,
		nCalls: 0,
		lastUsed: null,
		created: Date.now()
    });

    Key.findById('serverKey',function(err, serverKey){
        if(err || serverKey==null){
            Key.collection.insert(newKey, function(err) {
                if (err) {
                    throw err;
                } else {
                    console.log("Criada chave servidor!")
                }
            });
        }else{
            serverKey.key = token;
            serverKey.created = Date.now();
            serverKey.save(function(err) {
                if (err) {
                    throw err;
                } else {
                    console.log("Atualizada chave servidor!")
                }
            });
        }
    })
}