var Auth = module.exports
var passport = require("passport")
var jwt = require('jsonwebtoken');
var Key = require('../models/chave');
var apiKey = require('./../config/api');
var secretKey = require('./../config/app');

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

Auth.generateTokenUser = function (user) {
    var token = jwt.sign({id: user._id}, secretKey.key, {expiresIn: '8h', algorithm: "RS256"});

    return token
}

Auth.generateTokenKey = function () {
    var token = jwt.sign({}, secretKey.key, {expiresIn: '30d', algorithm: "RS256"});

    return token
}

//verifica se está forneceu chave API. Em caso afirmativo verifica se é válido. Caso não tenha fornecido uma chave API verifica se forneceu antes um token.
Auth.isLoggedInKey = async function (req, res, next) {
    var key = ExtractJWT.fromExtractors([
        ExtractJWT.fromBodyField('apikey'),
        ExtractJWT.fromUrlQueryParameter('apikey'),
        ExtractJWT.fromAuthHeaderWithScheme('apikey')
    ], req)

    if(key){
        if(key != apiKey){
            await Key.find({key: key}, async function(err, resp){
                if(err){
                    throw err;
                }else if(resp.length==0){
                    res.status(403).send('A sua chave API não se encontra na base de dados.');
                }else{
                    await jwt.verify(key, secretKey.key, async function(err, decoded){
                        if(err){
                            res.status(403).send('A sua chave API é inválida ou expirou.');
                        }else{
                            if(resp[0].active==true){
                                await Key.update({_id: resp[0]._id}, {nCalls: resp[0].nCalls+1, lastUsed: Date.now()}, function(err, affected, resp) {
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
            })
        }else{
            return next();
        }
    }else{
        return Auth.isLoggedInUser(req, res, next)
    }
}

//Verifica se um utilizador (token) está autenticado
Auth.isLoggedInUser = passport.authenticate("jwt", { session: false })
