var express = require('express');
var Logging = require('../../controllers/logging');
var router = express.Router();
var User = require('../../models/user');
var Users = require('../../controllers/api/users');
var AuthCalls = require('../../controllers/api/auth');
var Auth = require('../../controllers/auth');
var Mailer = require('../../controllers/api/mailer');
var mongoose = require('mongoose');

const { body, validationResult } = require('express-validator');
const { existe, estaEm, verificaExisteEnt, eNIC, verificaLista, verificaUserId, verificaEntId, vcUserLevels, vcUsersFormato } = require('../validation')

function emailNaoUsado(v){
    return new Promise((resolve, reject) => {
        Users.getUserByEmail(v, function (err, user) {
            if (!err && !user) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function nicNaoUsado(v){
    return new Promise((resolve, reject) => {
        Users.getUserByCC(v, function (err, user) {
            if (!err && !user) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function emailNaoUsadoSelf(v, {req}){
    return new Promise((resolve, reject) => {
        Users.getUserByEmail(v, function (err, user) {
            if (!err && !user) {
                resolve()
            } else if(user && user._id == req.params.id) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function nicNaoUsadoSelf(v, {req}){
    return new Promise((resolve, reject) => {
        Users.getUserByCC(v, function (err, user) {
            if (!err && !user) {
                resolve()
            } else if(user && user._id == req.params.id) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function unic(field){
    return function(v, {req}) {
        var n = req.body.users.filter(e => e[field] == v).length
        if(n < 2){
            return Promise.resolve()
        }else{
            return Promise.reject(`Multiplos utilizadores tem o mesmo ${field} '${v}'!`)
        }
    }
}

router.get('/', [
    verificaEntId('query', 'entidade').optional(),
    estaEm('query', 'formato', vcUsersFormato).optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Users.listar(req.query.entidade, req.query.formato, req.user.level, function(err, result){
        if(err){
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send("Não foi possível obter os utilizadores!");
        }else{
            res.json(result);
        }
    });
});

router.post('/registar', [
    verificaExisteEnt('body', 'entidade'),
    estaEm('body', 'type', vcUserLevels),
    existe('body', 'name'),
    existe('body', 'email')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .bail()
        .custom(emailNaoUsado)
        .withMessage("O email já se encontra em uso"),
    existe('body', 'password')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var internal = (req.body.type > 3);
    var newUser = new User({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        entidade: req.body.entidade,
        internal: internal,
        level: req.body.type,
        local: {
            password: req.body.password
        }
    });

    Users.createUser(newUser, function (err, user) {
        if (err) {
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        } else {
            res.send('Utilizador registado com sucesso!');
        }
    });
});

router.post('/registarParaEntidade', [
    verificaExisteEnt('body', 'entidade'),
    verificaLista('body', 'users'),
    existe('body', 'users.*.name'),
    existe('body', 'users.*.email')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .bail()
        .custom(unic('email'))
        .bail()
        .custom(emailNaoUsado)
        .withMessage(v => `O email '${v}' já se encontra em uso`),
    eNIC('body', 'users.*.nic')
        .bail()
        .custom(unic('nic'))
        .bail()
        .custom(nicNaoUsado)
        .withMessage(v => `Utilizador com NIC '${v}' já registado`),
    estaEm('body', 'users.*.type', vcUserLevels)
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Users.registarParaEntidade(req, req.body.entidade, req.body.users)
       .then(data => res.send(data))
       .catch(erro => res.status(500).send(erro))
});

router.post("/login", [
    existe('body', 'username')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'password')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Users.getUserByEmail(req.body.username, function (err, user) {
        if (err) 
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send("Não foi possível proceder a autenticação!");
        if (!user)
            //Não existe nenhum utilizador registado com esse email
            return res.status(401).send('Credenciais inválidas');
        else{
            req.login(user, () => {
                var token = Auth.generateTokenUser(user);

                res.send({
                    token: token,
                    name : user.name,
                    entidade: user.entidade
                })
            })
        }
    });
});

router.post('/recuperar', [
    existe('body', 'email')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    body('url', 'Valor não é um URL').isURL({require_tld: false})
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Users.getUserByEmail(req.body.email, function (err, user) {
        if (err)
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send("Não foi possível recuperar a conta!");
        if (!user)
            //Não existe nenhum utilizador registado com esse email
            //Por forma a não divulgar que emails estão já usados, será devolvido que foi enviado um email com sucesso
            res.send('Email enviado com sucesso!');
        else{
            Users.getUserById(user._id, async function(err, user){
                if(err)
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send("Não foi possível recuperar a conta!");
                if(user.local.password != undefined){
                    try{
                        var token = await Auth.generateTokenUserRecuperar(user);
                        Mailer.sendEmailRecuperacao(req.body.email, req.body.url.split('/recuperacao')[0]+'/alteracaoPasswordRecuperacao?jwt='+token);
                        res.send('Email enviado com sucesso!')
                    }catch(err){
                        return res.status(500).send("Não foi possível recuperar a conta!");
                    }
                }else{
                    //Este utilizador foi registado na plataforma CLAV através do Cartão de Cidadão, não existindo uma password para o mesmo
                    //Por forma a não divulgar que emails estão já usados, será devolvido que foi enviado um email com sucesso
                    res.send('Email enviado com sucesso!');
                }
            })
        }
    });
});

router.put('/:id/desativar', [
    verificaUserId('param', 'id')
], async function(req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.user.id != req.params.id){
        Users.desativar(req.params.id, function(err, user){
            if(err){
                //res.status(500).send(`Erro: ${err}`);
                res.status(500).send("Não foi possível desativar o utilizador!");
            }else{
                res.send('Utilizador desativado com sucesso!');
            }
        })
    }else{
        res.status(403).send('Não pode desativar o seu próprio utilizador!');
    }
});

router.delete('/:id', [
    verificaUserId('param', 'id')
], async function(req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.user.id != req.params.id){
        Users.eliminar(req.params.id, function(err, user){
            if(err){
                //res.status(500).send(`Erro: ${err}`);
                res.status(500).send("Não foi possível eliminar o utilizador!");
            }else{
                res.send('Utilizador eliminado com sucesso!');
            }
        })
    }else{
        res.status(403).send('Não pode eliminar o seu próprio utilizador!');
    }
});

//Funcoes de alteracao de utilizador
router.put('/:id/password', [
    verificaUserId('param', 'id'),
    existe('body', 'atualPassword').optional(),
    existe('body', 'novaPassword')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.user.level >= 6){
        if(req.body.atualPassword && req.params.id == req.user.id){
            Users.atualizarPasswordComVerificacao(req.params.id, req.body.atualPassword, req.body.novaPassword, function (err, cb) {
                if (err) {
                    res.status(500).send(err);
                } else res.send('Password atualizada com sucesso!')
            });
        }else{
            Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                if (err) {
                    res.status(500).send(err);
                } else res.send('Password atualizada com sucesso!')
            });
        }
    }else if(req.params.id == req.user.id){
        //Utilizador a recuperar a conta
        if(req.user.level == 0){
            Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                if (err) {
                    res.status(500).send(err);
                } else res.send('Password atualizada com sucesso!')
            });
        } else {
            Users.atualizarPasswordComVerificacao(req.params.id, req.body.atualPassword, req.body.novaPassword, function (err, cb) {
                if (err) {
                    res.status(500).send(err);
                } else res.send('Password atualizada com sucesso!')
            });
        }
    }else{
        //Não tem permissões para alterar a password de outro utilizador
        res.status(403).send("Não tem permissões suficientes!")
    }
});

router.put('/:id/nic', [
    verificaUserId('param', 'id'),
    eNIC('body', 'nic')
        .bail()
        .custom(nicNaoUsadoSelf)
        .withMessage("Já existe um utilizador com esse NIC")
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.params.id != req.user.id){
        Users.atualizarNIC(req.params.id, req.body.nic, function (err, u) {
            if (err) {
                //res.status(500).send(`Erro: ${err}`);
                res.status(500).send("Não foi possível atualizar o NIC do utilizador! Verifique os valores usados.");
            } else {
                res.send('NIC do utilizador atualizado com sucesso!')
            }
        });
    }else{
        res.status(403).send("Não pode alterar o seu próprio NIC!")
    }
});

router.put('/:id', [
    verificaUserId('param', 'id'),
    verificaExisteEnt('body', 'entidade'),
    estaEm('body', 'level', vcUserLevels),
    existe('body', 'nome'),
    existe('body', 'email')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .bail()
        .custom(emailNaoUsadoSelf)
        .withMessage("O email já se encontra em uso")
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Users.atualizarMultiplosCampos(req.params.id, req.body.nome, req.body.email, req.body.entidade, req.body.level, function (err, cb) {
        if (err) {
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send('Não foi possível atualizar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        } else {
            res.send('Utilizador atualizado com sucesso!')
        }
    });
});

router.get('/:id', [
    verificaUserId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.params.id == req.user.id || req.user.level >= 5){
        Users.listarPorId(req.params.id,function(err, result){
            if(err){
                //res.status(500).send(`Erro: ${err}`);
                res.status(404).send("Não foi possível obter o utilizador!");
            }else{
                result._doc.temPass = result._doc.local.password ? true : false
                if(req.user.level < 7){
                    delete result._doc.local
                }
                res.json(result);
            }
        });
    }else{
        //Não tem permissões para aceder à informação de outro utilizador
        res.status(403).send("Não tem permissões suficientes!")
    }
});

//Callback Autenticação.Gov
router.post('/callback', [
    existe('body', 'SAMLResponse')
], async function(req, res){
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    await Users.parseSAMLResponse(req.body.SAMLResponse, function(err, result){
        // console.log(result)
        AuthCalls.get(result.RequestID, function(err, url){
            if(!err && result.NIC!=undefined && result.NomeCompleto!=undefined){
                var NIC = Buffer.from(result.NIC, 'base64').toString('utf8');
                Users.getUserByCC(NIC, async function (err, user) {
                    if(!user){ //Este cartao cidadao nao tem user associado
                        res.writeHead(301,{
                            Location: url+'/users/HandlerCC?NIC='+result.NIC+'&Nome='+result.NomeCompleto
                        });
                        res.end();
                    }else{ //ja existe user com este cartao cidadao
                        try{
                            var token = await Auth.generateTokenUser(user);
                            var name = Buffer.from(user.name).toString('base64');
                            var entidade = Buffer.from(user.entidade).toString('base64');
                            res.writeHead(301,{
                                Location: url+'/users/HandlerCC?Token='+token+'&Nome='+name+'&Entidade='+entidade
                            });
                            res.end();
                        }catch(err){
                            res.writeHead(301,{
                                Location: url+'/users/HandlerCC'
                            });
                            res.end();
                        }
                    }
                })
            }else{
                res.writeHead(301,{
                    Location: url+'/users/HandlerCC'
                });
                res.end();
            }
        });
    })
});

//Registo via CC
router.post('/registarCC', [
    verificaExisteEnt('body', 'entidade'),
    existe('body', 'name'),
    existe('body', 'email')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .bail()
        .custom(emailNaoUsado)
        .withMessage("O email já se encontra em uso"),
    eNIC('body', 'nic')
        .bail()
        .custom(nicNaoUsado)
        .withMessage("Utilizador já se encontra registado"),
    estaEm('body', 'type', vcUserLevels)
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var internal = (req.body.type > 3);
    var newUser = new User({
        _id: req.body.nic,
        name: req.body.name,
        email: req.body.email,
        entidade: req.body.entidade,
        internal: internal,
        level: req.body.type
    });

    Users.createUser(newUser, function (err, user) {
        Logging.logger.info('Utilizador ' + user._id + ' registado.');
        if (err) {
            //return res.status(500).send(`Erro: ${err}`);
            res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        } else {
            res.send('Utilizador registado com sucesso!');
        }
    });
});

module.exports = router;
