var Auth = module.exports;
var passport = require("passport");
var ExtractJWT = require("passport-jwt").ExtractJwt;
var jwt = require('jsonwebtoken');
var Key = require('../models/chave');
var secretKey = require('./../config/app');
var Calls = require('./api/calls')

//WARNING: correr primeiro isLoggedInUser e só depois correr esta função como middleware
//clearance se for um número, permite o acesso a todos os utilizadores com nivel igual ou superior; se for uma lista de números, apenas permite ao acesso aos níveis presentes nessa lista.
Auth.checkLevel = function (clearance) {
    return function(req, res, next) {
        var havePermissions = false;

        //Array
        if (clearance instanceof Array) {
            if (clearance.includes(req.user.level)) {
                havePermissions = true;
            }
        //Number
        } else {
            if (req.user.level >= clearance) {
                havePermissions = true;
            }
        }

        if (havePermissions) {
            return next();
        } else {
            return res.status(403).send('Não tem permissões suficientes para aceder');
        }
    }
}

Auth.generateTokenEmail = function (user) {
    var token = jwt.sign({id: user._id}, secretKey.emailKey, {expiresIn: '30m'});

    return token
}

Auth.generateTokenUserRecuperar = function (user) {
    var token = jwt.sign({id: user._id, name: user.name}, secretKey.userKey, {expiresIn: '30m'});

    return token
}

Auth.generateTokenUser = function (user) {
    var token = jwt.sign({id: user._id, level: user.level, entidade: user.entidade}, secretKey.userKey, {expiresIn: '8h'});

    return token
}

Auth.generateTokenKey = function () {
    var token = jwt.sign({}, secretKey.apiKey, {expiresIn: '30d'});

    return token
}

//verifica se está forneceu chave API. Em caso afirmativo verifica se é válido. Caso não tenha fornecido uma chave API verifica se forneceu antes um token.
Auth.isLoggedInKey = async function (req, res, next) {
    var key = ExtractJWT.fromExtractors([
        ExtractJWT.fromUrlQueryParameter('apikey'),
        ExtractJWT.fromAuthHeaderWithScheme('apikey')
    ])(req)

    if(key){
        await Key.find({key: key}, async function(err, resp){
            if(err){
                throw err;
            }else if(resp.length==0){
                res.status(401).send('A sua chave API não se encontra na base de dados.');
            }else{
                await jwt.verify(key, secretKey.apiKey, async function(err, decoded){
                    if(err){
                        res.status(401).send('A sua chave API é inválida ou expirou.');
                    }else{
                        if(resp[0].active==true){
                            await Key.update({_id: resp[0]._id}, {nCalls: resp[0].nCalls+1, lastUsed: Date.now()}, function(err, affected, resp2) {
                                if(err){
                                    res.status(500).send('Ocorreu um erro ao atualizar chave API.');
                                }else{
                                    Calls.newCall(Calls.getRoute(req), req.method, resp[0]._id, "Chave")
                                        .then(data => next())    
                                        .catch(err => res.status(500).send('Ocorreu um erro ao realizar logging do pedido'))
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
        return Auth.isLoggedInUser(req, res, next)
    }
}

//Verifica se um utilizador (token) está autenticado
Auth.isLoggedInUser = function (req, res, next) {
    passport.authenticate("jwt", { session: false }, function(err, user, info) {
        if (err) { return res.status(401).send("Unauthorized") }
        if (!user) { return res.status(401).send("Unauthorized") }
        req.logIn(user, function(err) {
            if (err) { return res.status(401).send("Unauthorized") }

            Calls.newCall(Calls.getRoute(req), req.method, req.user.id, "User")
                .then(data => next())
                .catch(err => res.status(401).send("Unauthorized"))
        });
    })(req, res, next)
}
