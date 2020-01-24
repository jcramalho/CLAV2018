var User = require('../../models/user');
var AuthCall = require('../../models/auth');
var bcrypt = require('bcryptjs');
var xml2js = require('xml2js');
var mongoose = require('mongoose');
const request = require('../../controllers/api/utils').request

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
                            item["level"] = 'Utilizador Decisor';
                            break;
                        case 4:
                            item["level"] = 'Utilizador Validador';
                            break;
                        case 3.5:
                            item["level"] = 'Utilizador Validador (AD)';
                            break;
                        case 3:
                            item["level"] = 'Utilizador Avançado';
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
                users.map(u => delete u._doc.local);
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
    Users.getUserById(id, function(err, user){
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
    Users.getUserById(id, function(err, user){
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

Users.atualizarNIC = function(id, nic, callback){
    Users.getUserByCC(nic, function(err, userNIC){
        if (err) {	
            callback(err,null)
        } else if (!userNIC) {
            Users.eliminar(id, function(err, user){
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
                    newUser.save(function(err) {
                        if (err) {
                            callback(err, null);
                        }else{
                            callback(null, user)
                        }
                    });
                } else {
                    callback("Utilizador não existe", null)
                }
            });
        } else {
            callback("Já existe um utilizador com esse NIC", null)
        }
    });
}

Users.desativar = function(id, callback){
    Users.getUserById(id, function(err, user){
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
    var ent = entidade.split('_')[0] == 'ent' ? entidade : 'ent_' + entidade

    //validar se entidade existe
    try{
        await request.get(req, '/api/entidades/' + ent)
    } catch (e) {
        if(e.response.status == 404){
            throw('Entidade não existe! Nenhum utilizador foi registado. Tente novamente.')
        }else{
            throw('Não foi possível verificar se entidade existe. Nenhum utilizador foi registado. Tente novamente.')
        }
    }

    //validar se não há utilizadores com o mesmo email o nic na lista recebida
    //valida também se o type, email e nic tem um padrão correto
    var emails = []
    var nics = []

    for(var i = 0; i < users.length; i++){

        if(!users[i].name || !users[i].email || !users[i].nic || !users[i].type){
            throw('O utilizador no índice ' + i + ' não possui um dos seguinte campo: name, email, nic (Número do Cartão de Cidadão) ou type (tipo de conta). Nenhum utilizador foi registado. Tente novamente.')
        }else{
            if(!/^[0-9]$/g.test(users[i].type)){
                throw('O utilizador no índice ' + i + ' possui um type incorreto, tem de ser um número de 0 a 9! Nenhum utilizador foi registado. Tente novamente.')
            }

            var email = users[i].email
            var index = emails.indexOf(email)

            if(!/^.*@.*\..*$/g.test(email)){
                throw('O utilizador no índice ' + i + ' possui um email incorreto! Nenhum utilizador foi registado. Tente novamente.')
            }

            if(index == -1){
                emails.push(email)
            }else{
                throw('O utilizador no índice ' + index + ' e o utilizador no índice ' + i + ' tem o mesmo email! Nenhum utilizador foi registado. Tente novamente.')
            }

            var nic = users[i].nic
            index = nics.indexOf(nic)

            if(!/^[0-9]{7,}$/g.test(nic)){
                throw('O utilizador no índice ' + i + ' possui um NIC incorreto! Nenhum utilizador foi registado. Tente novamente.')
            }

            if(index == -1){
                nics.push(nic)
            }else{
                throw('O utilizador no índice ' + index + ' e o utilizador no índice ' + i + ' tem o mesmo NIC! Nenhum utilizador foi registado. Tente novamente.')
            }
        }
    }

    //validação dos utilizadores com a BD antes de os registar
    for(var i = 0; i < users.length; i++){
        try{
            var user = await new Promise((resolve, reject) => {
                Users.getUserByCC(users[i].nic, function (err, user) {
                    if (err) reject(err)
                    else resolve(user)
                })
            })
        } catch (err) {
            throw(`Erro ao verificar se utilizador já existe: ${err}`);
        }

        if (!user) {
            try{
                user = await new Promise((resolve, reject) => {
                    Users.getUserByEmail(users[i].email, function(err, user){
                        if (err) reject(err)
                        else resolve(user)
                    })
                })
            } catch(err) {
                throw(`Erro ao verificar se email já existe: ${err}`);
            }

            if (user) {
                throw('Email do utilizador no índice ' + i + ' já em uso! Nenhum utilizador foi registado. Tente novamente.');
            }
        } else {
            throw('Utilizador no indíce ' + i + ' já se encontra registado ou possui um NIC errado! Nenhum utilizador foi registado. Tente novamente.');
        }
    }

    //inserir os utilizadores na BD
    for(var i = 0; i < users.length; i++){
        var internal = (users[i].type > 1);
        var newUser = new User({
            _id: users[i].nic,
            name: users[i].name,
            email: users[i].email,
            entidade: ent,
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
