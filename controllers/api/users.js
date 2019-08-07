var User = require('../../models/user');
var bcrypt = require('bcryptjs');
var xml2js = require('xml2js');

var Users = module.exports

Users.createUser = function (newUser, callback) {
	bcrypt.genSalt(14, function (err, salt) {
		bcrypt.hash(newUser.local.password, salt, function (err, hash) {
			newUser.local.password = hash;
			newUser.save(callback);
		});
	});
}

Users.getUserByEmail = function (email, callback) {
	var query = { email: email };
	User.findOne(query, callback);
}

Users.getUserByCC = function (nic, callback) {
	var query = { _id:  nic};
	User.findOne(query, callback);
}

Users.getUserById = function (id, callback) {
	User.findById(id, callback);
}

Users.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		if (err) throw err;
		callback(null, isMatch);
	});
}

Users.listar = function(req, callback){
    var filtro = {}
    if(req.query.entidade!=undefined)
    filtro = {entidade: req.query.entidade};
    
    User.find(filtro, function(err,users){
        if(err){
            callback(err, null)
        }else{
            if(req.query.formato=='normalizado'){
                listaNormalizada = [];
                for(var i = 0; i < users.length; i++) {
                    item = {}
                    item["name"] = users[i].name;
                    item["entidade"] = users[i].entidade;
                    switch(users[i].level) {
                        case 7:
                            item["level"] = 'Administrador de Perfil Tecnológico';
                            break;
                        case 6:
                            item["level"] = 'Administrador de Perfil Funcional';
                            break;
                        case 5:
                            item["level"] = 'Utilizador Validador';
                            break;
                        case 4:
                            item["level"] = 'Utilizador Avançado';
                            break;
                        case 3:
                            item["level"] = 'Utilizador Decisor';
                            break;
                        case 2:
                            item["level"] = 'Utilizador Simples';
                            break;
                        case 1:
                            item["level"] = 'Representante Entidade';
                            break;
                        case -1:
                            item["level"] = 'Utilizador desativado';
                            break;
                    }
                    item["email"] = users[i].email;
                    item["id"] = users[i]._id;
                    listaNormalizada.push(item);
                }
                callback(null, listaNormalizada);
            }else
            callback(null, users);
        }
    })
}

Users.listarPorId = function(id, callback){
    User.findById(id, function(err, user){
        if(err){
            callback(err, null);
        }else{
            callback(null, user);
        }
    })
}

Users.atualizarNivel = function(id, level, callback){
    User.findById(id, function(err, user){
		if (err) {	
            callback(err, null);
		} else {
            user.level = level;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

Users.atualizarNome = function(id, name, callback){
    User.findById(id, function(err, user){
		if (err) {	
            callback(err, null);
		} else {
            user.name = name;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

Users.atualizarEmail = function(id, email, callback){
    User.findById(id, function(err, user){
		if (err) {	
            callback(err, null);
		} else {
            user.email = email;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

Users.atualizarMultiplosCampos = function(id, nome, email, entidade, level, callback){
    // console.log("ID: "+ id + " NOME: " + nome + " EMAIL: " + email + " LEVEL: " + level )
    User.findById(id, function(err, user){
		if (err) {	
            callback(err, null);
		} else {
            // console.log(user)
            user.name = nome;
            user.email = email;
            user.level = level;
            user.entidade = entidade;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

Users.atualizarPassword = function(id, password, callback){
    User.findById(id, function(err, user){
		if (err) {
            callback(err, null);
		} else {
            bcrypt.genSalt(14, function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    user.local.password = hash;
                    user.save(function(err) {
                        if (err) {
                            callback(err, null);
                        }else{
                            callback(null, user);
                        }
                    });
                });
            });
        }
    });
}

Users.desativar = function(id, callback){
    User.findById(id, function(err, user){
        if (err) {	
            callback(err,null)
        } else {
            user.level = -1;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

Users.eliminar = function(id, callback){
    User.findByIdAndRemove(id, function(err, user){
        if (err) {	
            callback(err, null)
        } else {
		    callback(null, user);
        }
    });
}

Users.listarEmail = function(id, callback){
    User.findById(id, function(err, user){
        if (err) {
            callback(err, null);
        }else{
            callback(null, user.email);
        };
    })
}

Users.adicionarChamadaApi = function(id, callback){
    User.findById(id, function(err, user){
        if (err) {	
            callback(err,null)
        } else {
            user.nCalls+=1;
            user.save(function(err) {
                if (err) {
		            callback(err, null);
                }else{
		            callback(null, user);
                }
            });
        }
    });
}

// Users.contarChamadasApi = function(callback){
//     User.find({}, function(err, users){
//         if(!err){
//             var calls = 0;
//             for(var i = 0; i < users.length; i++) {
//                 calls += users[i].nCalls;
//             }
//             callback(null, calls);
//         }else{
//             callback(err, null);
//         }
//     });
// }

Users.parseSAMLResponse = function(SAMLResponse, callback){
    var parser = new xml2js.Parser();
    parser.parseString(new Buffer.from(SAMLResponse, 'base64').toString('utf8'), function (err, result) {
        var statusMessage = result.Response.Status[0].StatusMessage;
        var isSucessfull = result.Response.Status[0].StatusCode[0].$.Value == 'urn:oasis:names:tc:SAML:2.0:status:Success';
        switch(statusMessage){
            case undefined:
                if(isSucessfull){
                    var NIC = Buffer.from(result.Response.Assertion[0].AttributeStatement[0].Attribute[0].AttributeValue[0]._).toString('base64');
                    var NomeCompleto = Buffer.from(result.Response.Assertion[0].AttributeStatement[0].Attribute[1].AttributeValue[0]._).toString('base64');
                    callback(null, {NIC: NIC, NomeCompleto: NomeCompleto});
                }else{
                    callback(err, null);
                }
                break;
            default:
                callback(err, null);
                break;
        }
    });
}