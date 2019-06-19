var jwt = require('jsonwebtoken');
var secretKey = require('./../../config/app');
var Chave = require('./../../models/chave');
var Chaves = module.exports

Chaves.listar = function(callback){
    jsonObj = [];
    Chave.find({}, function(err, keys){
        if (err) {
            callback(err, null)
        }else {
            for(var i = 0; i < keys.length; i++) {
                item = {}
                jwt.verify(keys[i].key, secretKey.key, function(err, decoded){
                    item["expiration"] = new Date(decoded.exp*1000).toDateString();
                });
                item["id"] = keys[i]._id;
                item["name"] = keys[i].name;
                item["key"] = keys[i].key;
                item["nCalls"] = keys[i].nCalls;
                item["created"] = keys[i].created.toDateString();
                item["contactInfo"] = keys[i].contactInfo;
                item["entity"] = keys[i].entity;
                if(keys[i].lastUsed!=null)
                    item["lastUsed"] = keys[i].lastUsed.toDateString();
                else
                    item["lastUsed"] = 'Nunca';
                if(keys[i].active==true)
                    item["active"] = 'Sim'
                else
                    item["active"] = 'Não';
                jsonObj.push(item);
            }
            callback(null,jsonObj);
        }
    });
}

Chaves.listarPorId = function(id, callback){
    Chave.findById(id, function(err, key){
		if (err) {	
			callback(err, null)
		} else {
            callback(null, key)
        }
	});
};

Chaves.listarPorEmail = function (email, callback) {
	var query = { contactInfo: email };
	Chave.findOne(query, callback);
}

Chaves.criarChave = function(name, email, entidade, callback){
    var newKey = new Chave({
        key: jwt.sign({}, secretKey.key, {expiresIn: '30d'}),
        name: name,
		contactInfo: email,
        entity: entidade
    });

	Chave.collection.insert(newKey, function(err, key) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, key);
		}
	});
};

Chaves.desativar = function(id, callback){
    Chave.findById(id, function(err, key){
        if (err) {	
            callback(err, null);
        } else {
			key.active = false;
 			key.save(function(err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, key);
				}
			});
		}
    });
};

Chaves.ativar = function(id,callback){
    Chave.findById(id, function(err, key){
        if (err) {	
            callback(err, null);
        } else {
			key.active = true;
			key.save(function(err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, key);
				}
			});
		}
    });
};

Chaves.eliminar = function(id, callback){
	Chave.findByIdAndRemove(id, function(err, key){
		if(err){
			callback(err, null);
		}else{
			callback(null, key);
		}
	});
};

// Chaves.renovar = function(id, callback){
// 	Chave.findById(id, function(err, key){
// 		if(err){
// 			callback(err, null);
// 		}else{
// 			//TODO
//  			key.save(function(err) {
// 				if (err) {
// 					callback(err, null);
// 				} else {
// 					callback(null, key);
// 				}
// 			});
// 		}
// 	});
// };

Chaves.atualizarMultiplosCampos = function(id, name, email, entidade, callback){
    // console.log("ID: "+ id + " NOME: " + nome + " EMAIL: " + email + " LEVEL: " + level )
    Chave.findById(id, function(err, chave){
		if (err) {	
            callback(err, null);
		} else {
            chave.name = name;
            chave.contactInfo = email;
            chave.entity = entidade;
            chave.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, chave);
                }
            });
        }
    });
}