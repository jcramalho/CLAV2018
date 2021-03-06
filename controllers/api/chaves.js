var Auth = require('../../controllers/auth');
var Chave = require('./../../models/chave');
var mongoose = require('mongoose');
var Chaves = module.exports

Chaves.listar = function(callback){
    jsonObj = [];
    Chave.find({}, async function(err, keys){
        if (err) {
            callback(err, null)
        }else {
            for(var i = 0; i < keys.length; i++) {
                item = {}
                await Auth.verifyTokenKey(keys[i].key, function(err, decoded){
                    if(!err){
                        item["expiration"] = new Date(decoded.exp*1000).toLocaleString();
                    }else{
                        item["expiration"] = new Date(err.expiredAt).toLocaleString();
                    }
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
    var ent = entidade.split('_')[0] == 'ent' ? entidade : 'ent_' + entidade
    var id = mongoose.Types.ObjectId()
    var newKey = new Chave({
        _id: id,
        key: Auth.generateTokenKey(id),
        name: name,
		contactInfo: email,
        entity: ent
    });

	Chave.collection.insertOne(newKey, function(err, key) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, key);
		}
	});
};

Chaves.desativar = function(id, callback){
    Chave.findById(id, async function(err, key){
        if (err) {	
            callback(err, null);
        }else if(!key){
            callback("Chave API não existe", null);
        } else {
			key.active = false;
            try{
 			    key = await key.save()
                callback(null, key)
			}catch(err){
                callback(err, null)
            }
		}
    });
};

Chaves.ativar = function(id,callback){
    Chave.findById(id, async function(err, key){
        if (err) {	
            callback(err, null);
        }else if(!key){
            callback("Chave API não existe", null);
        } else {
			key.active = true;
            try{
 			    key = await key.save()
                callback(null, key)
			}catch(err){
                callback(err, null)
            }
		}
    });
};

Chaves.eliminar = function(id, callback){
	Chave.findByIdAndRemove(id, function(err, key){
		if(err){
			callback(err, null);
        }else if(!key){
            callback("Chave API não existe", null);
		}else{
			callback(null, key);
		}
	});
};

Chaves.renovar = function(id, callback){
	Chave.findById(id, async function(err, key){
		if(err){
			callback(err, null);
        }else if(!key){
            callback("Chave API não existe", null);
		}else{
            key.key = Auth.generateTokenKey(key._id);
            key.created = Date.now();
            key.nCalls = 0;
            key.lastUsed = null;
            try{
 			    key = await key.save()
                callback(null, key)
			}catch(err){
                callback(err, null)
            }
		}
	});
};

Chaves.atualizarMultiplosCampos = function(id, name, email, entidade, callback){
    Chave.findById(id, async function(err, chave){
		if (err) {	
            callback(err, null);
        }else if(!chave){
            callback("Chave API não existe", null);
		} else {
            chave.name = name;
            chave.contactInfo = email;
            chave.entity = entidade;
            try{
 			    chave = await chave.save()
                callback(null, chave)
			}catch(err){
                callback(err, null)
            }
        }
    });
};
