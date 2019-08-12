var Auth = module.exports
var jwt = require('jsonwebtoken');
var Key = require('../models/chave');
var ApiKey = require('./../config/api');
var secretKey = require('./../config/app');
var Users = require('../controllers/api/users');
const axios = require('axios');
const myhost = require('./../config/database').host

Auth.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(403).send('Login necessário para aceder a esta página');
}

Auth.checkLevel1 = function (req, res, next) {
    return Auth.isLevel(1, req, res, next);
}

Auth.checkLevel2 = function (req, res, next) {
    return Auth.isLevel(2, req, res, next);
}

Auth.checkLevel3 = function (req, res, next) {
    return Auth.isLevel(3, req, res, next);
}

Auth.checkLevel4 = function (req, res, next) {
    return Auth.isLevel(4, req, res, next);
}

Auth.checkLevel5 = function (req, res, next) {
    return Auth.isLevel(5, req, res, next);
}

Auth.checkLevel6 = function (req, res, next) {
    return Auth.isLevel(6, req, res, next);
}

Auth.checkLevel7 = function (req, res, next) {
    return Auth.isLevel(7, req, res, next);
}

Auth.isLevel = function (clearance, req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.level >= clearance) {
            return next();
        } else {
            return res.status(403).send('Não tem permissões suficientes para aceder a esta página');
        }
    } else {
        res.status(403).send('Login necessário para aceder a esta página');
    }
}

// Auth.isLoggedInAPI = function (req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.send('Login necessário para esta operação');
// }


Auth.isLoggedInAPI = async function (req, res, next) {
    await Key.find({key: ApiKey.key}, async function(err, resp){
        if(err){
            throw err;
        }else if(resp.length==0){
            res.status(403).send('A sua chave API não se encontra na base de dados.');
        }else{
            await jwt.verify(ApiKey.key, secretKey.key, async function(err, decoded){
                if(err){
                    res.status(403).send('A sua chave API é inválida ou expirou.');
                }else{
                    await Key.find({}, async function(err, keys){
                        for(var i = 0; i < keys.length; i++) {
                            if(keys[i].key==ApiKey.key){
                                await Key.findById(keys[i]._id, async function(err, key){
                                    if(err){
                                        throw err;
                                    }else{
                                        if(key.active==true){
                                            await Key.update({_id: key._id}, {nCalls: key.nCalls+1, lastUsed: Date.now()}, function(err, affected, resp) {
                                                if(err){
                                                    res.status(500).send('Ocorreu um erro ao atualizar chave API.');
                                                }else{
                                                    return next();
                                                }
                                            })
                                        }else{
                                            res.status(403).send('A sua chave API foi desativada, por favor contacte os administradores do sistema.');
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    })
}

Auth.isLoggedInNEW = async function (req, res, next) {
    if(req.body.token){
        await jwt.verify(req.body.token, secretKey.key, async function(err, decoded){
            if(!err){
                console.log("TOKEN VALIDO: " + decoded.id)
                let user = await axios.get(myhost + "/api/users/" + decoded.id);
                if(user.data._id!=undefined){
                    // await axios.get(myhost + 'api/users/adicionarChamadaApi/' + decoded.id)
                    await Users.adicionarChamadaApi(decoded.id,function (err, cb) {
                        if (err) 
                            throw err;
                        else 
                            return next();
                    });
                }
            }
            else{
                console.log("TOKEN INVALIDO: " + err)
            }
        });
    }
    else{
        console.log("TOKEN INEXISTENTE!")
    }
}
