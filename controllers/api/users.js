var User = require('../../models/user');
var bcrypt = require('bcryptjs');
var xml2js = require('xml2js');
var mongoose = require('mongoose');
const salt = 14

var Users = module.exports

Users.createUser = function (newUser, callback) {
	bcrypt.genSalt(salt, function (err, salt) {
		bcrypt.hash(newUser.local.password, salt, async function (err, hash) {
			newUser.local.password = hash;
            try{
			    newUser = await newUser.save()
                callback(null, newUser)
            }catch(err){
                callback(err, null)
            }
		});
	});
}

Users.getUserByEmail = function (email, callback) {
	var query = { email: email };
	User.findOne(query, callback);
}

Users.getUserByCC = function (nic, callback) {
	var query = { _id: nic};
	User.findOne(query, callback);
}

Users.getUserById = function (id, callback) {
	Users.getUserByCC(id, function(err, user1){
        if(err || !user1){
            try{
                id = mongoose.Types.ObjectId(id)
                Users.getUserById(id, function(err, user2){
                    if(err || !user2){
                        callback(err, null);
                    }else{
                        callback(null, user2);
                    }
                })
            }catch(e){
                callback("Utilizador não existe", null)
            }
        }else{
            callback(null, user1);
        }
    });
}

Users.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		callback(null, isMatch);
	});
}

Users.listar = function(entidade, normalizado, userLevel, callback){
    var filtro = {}
    if(entidade)
        filtro.entidade = entidade
    
    User.find(filtro, function(err,users){
        if(err){
            callback(err, null)
        }else{
            if(normalizado){
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
                            item["level"] = 'Utilizador Decisor';
                            break;
                        case 4:
                            item["level"] = 'Utilizador Validador';
                            break;
                        case 3.5:
                            item["level"] = 'Utilizador Avançado';
                            break;
                        case 3:
                            item["level"] = 'Utilizador Arquivo Distrital';
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
            }else{
                if(userLevel < 7){
                    users.map(u => delete u._doc.local);
                }
                callback(null, users);
            }
        }
    })
}

Users.listarPorId = function(id, callback){
    Users.getUserById(id, function(err, user){
        if(err){
            callback(err, null);
        }else{
            callback(null, user);
        }
    });
}

Users.atualizarMultiplosCampos = function(id, nome, email, entidade, level, callback){
    Users.getUserById(id, async function(err, user){
		if (err) {	
            callback(err, null);
		} else {
            // console.log(user)
            user.name = nome;
            user.email = email;
            user.level = level;
            user.entidade = entidade;
            try{
                user = await user.save()
                callback(null, user);
            }catch(err){
		        callback(err, null);
            }
        }
    });
}

function genAndSave(user, password, callback){
    bcrypt.genSalt(salt, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            user.local.password = hash;
            try{
                user = await user.save()
                callback(null, user)
            }catch(err){
                callback("Não foi possível atualizar a password do utilizador!", null)
            }
        });
    });
}

Users.atualizarPassword = function(id, password, callback){
    Users.getUserById(id, function(err, user){
		if (err) {
            callback("Não foi possível atualizar a password do utilizador!", null);
		} else {
            genAndSave(user, password, callback)
        }
    });
}

Users.atualizarPasswordComVerificacao = function(id, atualPassword, novaPassword, callback){
    Users.getUserById(id, function(err, user){
		if (err || !user) {
            callback("Não foi possível atualizar a password do utilizador!", null);
		} else if(user.local.password != undefined){
            if(!atualPassword){
                callback("Precisa de indicar a password atual!", null)
            }else{
                Users.comparePassword(atualPassword, user.local.password, function(err, isMatch) {
                    if (err) {
                        callback("Não foi possível atualizar a password do utilizador!", null);
                    }else{
                        if(isMatch){
                            genAndSave(user, novaPassword, callback)
                        }else{
                            callback("Credenciais inválidas", null)
                        }
                    }
                })
            }
        } else {
            genAndSave(user, novaPassword, callback)
        }
    });
}

Users.atualizarNIC = function(id, nic, callback){
    Users.eliminar(id, async function(err, user){
        if (err) {	
            callback(err,null)
        } else if(user) {
            newUser = new User({
                _id: nic,
                name: user.name,
                email: user.email,
                entidade: user.entidade,
                internal: user.internal,
                level: user.level
            })

            if("local" in user){
                newUser.local = {
                    password: user.local.password
                }
            }
            try{
                user = await newUser.save()
                callback(null, user)
            }catch(err){
                callback(err, null)
            }
        } else {
            callback("Utilizador não existe", null)
        }
    });
}

Users.desativar = function(id, callback){
    Users.getUserById(id, async function(err, user){
        if (err) {	
            callback(err,null)
        } else {
            user.level = -1;
            try{
                user = await user.save()
                callback(null, user)
            }catch(err){
                callback(err, null)
            }
        }
    });
}

Users.eliminar = function(id, callback){
    User.findOneAndRemove({_id: id}, function(err, user){
        if (err) {	
            callback(err, null);
        } else if(!user){
            try{
                id = mongoose.Types.ObjectId(id)
                User.findOneAndRemove({_id: id}, function(err2, user2){
                    if(err2){
                        callback(err2, null);
                    }else{
                        callback(null, user2);
                    }
                })
            }catch(e){
                callback("Utilizador não existe", null)
            }
        } else {
		    callback(null, user);
        }
    });
}

Users.listarEmail = function(id, callback){
    Users.getUserById(id, function(err, user){
        if (err) {
            callback(err, null);
        }else{
            callback(null, user.email);
        };
    })
}

Users.adicionarChamadaApi = function(id, callback){
    User.findOneAndUpdate({_id: id}, {$inc: {nCalls: 1}}, {useFindAndModify: false}, function(err, user){
        if (err) {	
            callback(err,null)
        } else {
            user.nCalls++;
		    callback(null, user);
        }
    });
}

Users.parseSAMLResponse = function(SAMLResponse, callback){
    var parser = new xml2js.Parser();
    parser.parseString(new Buffer.from(SAMLResponse, 'base64').toString('utf8'), function (err, result) {
        var statusMessage = result.Response.Status[0].StatusMessage;
        var isSucessfull = result.Response.Status[0].StatusCode[0].$.Value == 'urn:oasis:names:tc:SAML:2.0:status:Success';
        switch(statusMessage){
            case undefined:
                if(isSucessfull){
                    var RequestID = result.Response.Assertion[0].Subject[0].SubjectConfirmation[0].SubjectConfirmationData[0].$.InResponseTo;
                    var NIC = Buffer.from(result.Response.Assertion[0].AttributeStatement[0].Attribute[0].AttributeValue[0]._).toString('base64');
                    var NomeCompleto = Buffer.from(result.Response.Assertion[0].AttributeStatement[0].Attribute[1].AttributeValue[0]._).toString('base64');
                    callback(null, {NIC: NIC, NomeCompleto: NomeCompleto, RequestID: RequestID});
                }else{
                    var RequestID = result.Response.Assertion[0].Subject[0].SubjectConfirmation[0].SubjectConfirmationData[0].$.InResponseTo;
                    callback(err, {RequestID: RequestID});
                }
                break;
            default:
                var RequestID = result.Response.Assertion[0].Subject[0].SubjectConfirmation[0].SubjectConfirmationData[0].$.InResponseTo;
                callback(err, {RequestID: RequestID});
                break;
        }
    });
}

Users.registarParaEntidade = async function(req, entidade, users){
    for(var i = 0; i < users.length; i++){
        var internal = (users[i].type > 3);
        var newUser = new User({
            _id: users[i].nic,
            name: users[i].name,
            email: users[i].email,
            entidade: entidade,
            internal: internal,
            level: users[i].type
        });

        try{
            await new Promise((resolve, reject) => {
                Users.createUser(newUser, function (err, user) {
                    if (err) reject(err)
                    else resolve(user)
                })
            })
        }catch(err){
            throw(`Erro no registo do utilizador no índice ${i}. Apenas foram registados os utilizadores anteriores a este.`);
        }
    }
    return "Utilizadores registados com sucesso!"
}
