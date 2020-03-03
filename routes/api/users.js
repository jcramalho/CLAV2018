var express = require('express');
var Logging = require('../../controllers/logging');
var router = express.Router();
var passport = require('passport');
var User = require('../../models/user');
var Users = require('../../controllers/api/users');
var AuthCalls = require('../../controllers/api/auth');
var Auth = require('../../controllers/auth');
var jwt = require('jsonwebtoken');
var secretKey = require('./../../config/app');
var Mailer = require('../../controllers/api/mailer');
var mongoose = require('mongoose');

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Users.listar(req,function(err, result){
        if(err){
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send("Não foi possível obter os utilizadores!");
        }else{
            res.json(result);
        }
    });
});

router.get('/:id/token', Auth.isLoggedInUser, async function(req,res){
    await jwt.verify(req.params.id, secretKey.userKey, async function(err, decoded){
        if(!err){
            if(decoded.id == req.user.id || req.user.level == 7){
                await Users.listarPorId(decoded.id, function(err, result){
                    if(err){
                        //res.status(500).send(err);
                        res.status(500).send("Não foi possível obter o utilizador!");
                    }else{
                        result._doc.local = result._doc.local.password ? true : false
                        res.send(result);
                    }
                });
            }else{
                //Não tem permissões para aceder à informação de outro utilizador
                res.status(403).send("Não tem permissões suficientes!")
            }
        }else{
            //res.status(403).send(err);
            res.status(500).send("Não foi possível obter o utilizador!");
        }
    });
});

router.get('/token', Auth.isLoggedInUser, async function(req,res){
    res.send(req.user);
});

router.post('/registar', Auth.isLoggedInUser, Auth.checkLevel(5), function (req, res) {
    var ent = req.body.entidade.split("_").pop()
    var internal = (req.body.type > 1);
    var newUser = new User({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        entidade: 'ent_' + ent,
        internal: internal,
        level: req.body.type,
        local: {
            password: req.body.password
        }
    });
    
    Users.getUserByEmail(req.body.email, async function (err, user) {
        if (err) {
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        }

        if (!user) {
            await Users.createUser(newUser, function (err, user) {
                if (err) {
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
                }
            });
            res.send('Utilizador registado com sucesso!');
        } else {
            //Email já em uso
            res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        }
    });
});

router.post('/registarParaEntidade', Auth.isLoggedInUser, Auth.checkLevel(5), function (req, res) {
    if(req.body.users instanceof Array && req.body.entidade){
        Users.registarParaEntidade(req, req.body.entidade, req.body.users)
           .then(data => res.send(data))
           .catch(erro => res.status(500).send(erro))
    }else{
        res.status(500).send('O body deve possuir uma lista de utilizadores (users) e a entidade a adicionar os utilizadores (entidade).')
    }
});

router.post("/login", (req, res, next) => {
    passport.authenticate('login', (err, user, info) => {
        if (err)
            //res.status(500).send(err)
            res.status(500).send("Não foi possível proceder a autenticação!")
        if (!user)
            res.status(401).send('Credenciais inválidas')
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
    })(req, res, next);
});

router.post('/recuperar', function (req, res) {
    Users.getUserByEmail(req.body.email, function (err, user) {
        if (err) 
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send("Não foi possível recuperar a conta!");
        if (!user)
            //Não existe nenhum utilizador registado com esse email
            //Por forma a não divulgar que emails estão já usados, será devolvido que foi enviado um email com sucesso
            res.send('Email enviado com sucesso!');
        else{
            Users.getUserById(user._id, function(err, user){
                if(err) 
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send("Não foi possível recuperar a conta!");
                if(user.local.password != undefined){
                    var token = Auth.generateTokenUserRecuperar(user);
                    Mailer.sendEmailRecuperacao(req.body.email, req.body.url.split('/recuperacao')[0]+'/alteracaoPasswordRecuperacao?jwt='+token);
                    res.send('Email enviado com sucesso!')
                }else{
                    //Este utilizador foi registado na plataforma CLAV através do Cartão de Cidadão, não existindo uma password para o mesmo
                    //Por forma a não divulgar que emails estão já usados, será devolvido que foi enviado um email com sucesso
                    res.send('Email enviado com sucesso!');
                }
            })
        }
    });
});

router.put('/:id/desativar', Auth.isLoggedInUser, Auth.checkLevel(5), async function(req, res) {
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
        res.status(500).send('Não pode desativar o seu próprio utilizador!');
    }
});

router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel(7), async function(req, res) {
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
        res.status(500).send('Não pode eliminar o seu próprio utilizador!');
    }
});

//Funcoes de alteracao de utilizador
router.put('/:id/password', Auth.isLoggedInUser, function (req, res) {
    if(req.user.level >= 6){
        //Se enviou a password atual e é a sua conta
        if(req.body.atualPassword && req.body.novaPassword && req.params.id == req.user.id){
            Users.getUserById(req.params.id, function(err, user) {
                if(err) {
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send("Não foi possível atualizar a password do utilizador!");
                }

                if(user.local.password != undefined){
                    Users.atualizarPasswordComVerificacao(req.params.id, req.body.atualPassword, req.body.novaPassword, function (err, cb) {
                        if (err) {
                            //res.status(500).send(`Erro: ${err}`);
                            res.status(500).send("Não foi possível atualizar a password do utilizador!");
                        } else res.send('Password atualizada com sucesso!')
                    });
                }else{
                    Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                        if (err) {
                            //res.status(500).send(`Erro: ${err}`);
                            res.status(500).send("Não foi possível atualizar a password do utilizador!");
                        } else res.send('Password atualizada com sucesso!')
                    });
                }
            })
        //se não enviou a password atual ou não é a sua conta
        }else if(req.body.novaPassword){
            Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                if (err) {
                    //res.status(500).send(`Erro: ${err}`);
                    res.status(500).send("Não foi possível atualizar a password do utilizador!");
                } else res.send('Password atualizada com sucesso!')
            });
        }else{
            res.status(500).send("Faltam campos para puder atualizar a password: atualPassword e/ou novaPassword!")
        }
    }else if(req.params.id == req.user.id){
        //Utilizador a recuperar a conta
        if(req.user.level == 0 && req.body.novaPassword){
            Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                if (err) {
                    //res.status(500).send(`Erro: ${err}`);
                    res.status(500).send("Não foi possível atualizar a password do utilizador!");
                } else res.send('Password atualizada com sucesso!')
            });
        } else {
            Users.getUserById(req.params.id, function(err, user) {
                if(err) {
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send("Não foi possível atualizar a password do utilizador!");
                }

                if(user.local.password != undefined){
                    if(req.body.atualPassword && req.body.novaPassword){
                        Users.atualizarPasswordComVerificacao(req.params.id, req.body.atualPassword, req.body.novaPassword, function (err, cb) {
                            if (err) {
                                //res.status(500).send(`Erro: ${err}`);
                                res.status(500).send("Não foi possível atualizar a password do utilizador!");
                            } else res.send('Password atualizada com sucesso!')
                        });
                    }else{
                        res.status(500).send("Faltam campos para puder atualizar a password: atualPassword e/ou novaPassword!")
                    }
                }else{
                    if (req.body.novaPassword){
                        Users.atualizarPassword(req.params.id, req.body.novaPassword, function (err, cb) {
                            if (err) {
                                //res.status(500).send(`Erro: ${err}`);
                                res.status(500).send("Não foi possível atualizar a password do utilizador!");
                            } else res.send('Password atualizada com sucesso!')
                        });
                    }else{
                        res.status(500).send("Faltam campos para puder atualizar a password: atualPassword e/ou novaPassword!")
                    }
                }
            })
        }
    }else{
        //Não tem permissões para alterar a password de outro utilizador
        res.status(403).send("Não tem permissões suficientes!")
    }
});

router.put('/:id/nic', Auth.isLoggedInUser, Auth.checkLevel(7), function (req, res) {
    if(req.params.id != req.user.id){
        if(req.body.nic){
            Users.atualizarNIC(req.params.id, req.body.nic, function (err, u) {
                if (err) { 
                    //res.status(500).send(`Erro: ${err}`);
                    res.status(500).send("Não foi possível atualizar o NIC do utilizador! Verifique os valores usados.");
                } else {
                    res.send('NIC do utilizador atualizado com sucesso!')
                }
            });
        }else{
            res.status(500).send("Por forma a atualizar o NIC precisa de enviar o campo nic com o novo valor!")
        }
    }else{
        res.status(403).send("Não pode alterar o seu próprio NIC!")
    }
});

router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel(5), function (req, res) {
    Users.getUserByEmail(req.body.email, function(err,user){
        if(user && req.params.id != user._id){
            //Já existe utilizador registado com esse email
            res.status(500).send('Não foi possível atualizar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        }else{
            Users.atualizarMultiplosCampos(req.params.id, req.body.nome, req.body.email, req.body.entidade, req.body.level, function (err, cb) {
                if (err) { 
                    //res.status(500).send(`Erro: ${err}`);
                    res.status(500).send('Não foi possível atualizar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
                } else {
                    res.send('Utilizador atualizado com sucesso!')
                }
            });
        }
    });
});

router.get('/:id', Auth.isLoggedInUser, (req, res) => {
    if(req.params.id == req.user.id || req.user.level >= 5){
        Users.listarPorId(req.params.id,function(err, result){
            if(err){
                //res.status(500).send(`Erro: ${err}`);
                res.status(500).send("Não foi possível obter o utilizador!");
            }else{
                result._doc.local = result._doc.local.password ? true : false
                res.json(result);
            }
        });
    }else{
        //Não tem permissões para aceder à informação de outro utilizador
        res.status(403).send("Não tem permissões suficientes!")
    }
});

//Callback Autenticação.Gov
router.post('/callback', async function(req, res){
    await Users.parseSAMLResponse(req.body.SAMLResponse, function(err, result){
        // console.log(result)
        AuthCalls.get(result.RequestID, function(err, url){
            if(!err && result.NIC!=undefined && result.NomeCompleto!=undefined){
                var NIC = Buffer.from(result.NIC, 'base64').toString('utf8');
                Users.getUserByCC(NIC, function (err, user) {
                    if(!user){ //Este cartao cidadao nao tem user associado
                        res.writeHead(301,{
                            Location: url+'/users/HandlerCC?NIC='+result.NIC+'&Nome='+result.NomeCompleto
                        });
                        res.end();
                    }else{ //ja existe user com este cartao cidadao
                        var token = Auth.generateTokenUser(user);
                        var name = Buffer.from(user.name).toString('base64');
                        var entidade = Buffer.from(user.entidade).toString('base64');
                        res.writeHead(301,{
                            Location: url+'/users/HandlerCC?Token='+token+'&Nome='+name+'&Entidade='+entidade
                        });
                        res.end();
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
router.post('/registarCC', Auth.isLoggedInUser, Auth.checkLevel(5), function (req, res) {
    var internal = (req.body.type > 1);
    var newUser = new User({
        _id: req.body.nic,
        name: req.body.name,
        email: req.body.email,
        entidade: 'ent_'+req.body.entidade,
        internal: internal,
        level: req.body.type
    });
    
    Users.getUserByCC(req.body.nic, function (err, user) {
        if (err) { 
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        }

        if (!user) {
            Users.getUserByEmail(req.body.email, function(err, user){
                if (err) {
                    //return res.status(500).send(`Erro: ${err}`);
                    return res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
                }

                if (!user) {
                    Users.createUser(newUser, function (err, user) {
                        Logging.logger.info('Utilizador ' + user._id + ' registado.');
                        if (err) {
                            //return res.status(500).send(`Erro: ${err}`);
                            return res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
                        }
                    });
                    res.send('Utilizador registado com sucesso!');
                }else{
                    //Email já em uso
                    res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
                }
            })
        } else {
            //Utilizador já registado
            res.status(500).send('Não foi possível registar o utilizador! Verifique se os valores estão corretos ou se falta algum valor.');
        }
    });
});

module.exports = router;
