var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
	useMongoClient: true,
});

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

module.exports = mongoose.model('Chave', ChaveSchema);

// module.exports.generateServerKey = function () {
// 	var token = jwt.sign({}, secretKey.key);
//     var newKey = new Key({
//         _id: 'serverKey',
//         key: token,
// 		nCalls: 0,
// 		lastUsed: null,
// 		created: Date.now()
//     });

//     Key.findById('serverKey',function(err, serverKey){
//         if(err || serverKey==null){
//             Key.collection.insert(newKey, function(err) {
//                 if (err) {
//                     throw err;
//                 } else {
//                     console.log("Criada chave servidor!")
//                 }
//             });
//         }else{
//             serverKey.key = token;
//             serverKey.created = Date.now();
//             serverKey.save(function(err) {
//                 if (err) {
//                     throw err;
//                 } else {
//                     console.log("Atualizada chave servidor!")
//                 }
//             });
//         }
//     })
// }