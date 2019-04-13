var User = require('../../models/user');
var bcrypt = require('bcryptjs');
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

Users.getUserByCC = function (cc, callback) {
	var query = { cc: cc };
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

Users.listar = function(callback) {
    User.find({}, function(err, users){
        if (err) {
            throw err;
        }else {
            jsonObj = [];
            for(var i = 0; i < users.length; i++) {
                item = {}
                item["name"] = users[i].name;
                switch(users[i].level) {
                    case 7:
                        item["level"] = 'Administrador de Perfil Tecnológico (Nível 7)';
                        break;
                    case 6:
                        item["level"] = 'Administrador de Perfil Funcional (Nível 6)';
                        break;
                    case 5:
                        item["level"] = 'Utilizador Validador (Nível 5)';
                        break;
                    case 4:
                        item["level"] = 'Utilizador Avançado (Nível 4)';
                        break;
                    case 3:
                        item["level"] = 'Utilizador Decisor (Nível 3)';
                        break;
                    case 2:
                        item["level"] = 'Utilizador Simples (Nível 2)';
                        break;
                    case 1:
                        item["level"] = 'Representante Entidade (Nível 1)'
                        break;
                    case -1:
                        item["level"] = 'Utilizador desativado (Nível -1)'
                        break;
                }
                item["email"] = users[i].email;
                item["id"] = users[i]._id;
                jsonObj.push(item);
            }
        }
        return callback(jsonObj);
    });
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

Users.listarEmail = function(id, callback){
    User.findById(id, function(err, email){
        if (err) {
            callback(err, null);
        }else{
            callback(null, user.email);
        };
    })
}