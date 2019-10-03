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

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    Users.listar(req,function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});

router.get('/listarEmail/:id', Auth.isLoggedInUser, function(req, res) {
    if(req.params.id == req.user.id || req.user.level == 7){
        Users.listarEmail(req.params.id,function(err, email){
            if(err){
                return res.status(500).send(`Erro: ${err}`);
            }else{
                return res.json(email);
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para aceder à informação de outro utilizador!")
    }
});

router.get('/listarToken/:id', Auth.isLoggedInUser, async function(req,res){
    await jwt.verify(req.params.id, secretKey.userKey, async function(err, decoded){
        if(!err){
            if(decoded.id == req.user.id || req.user.level == 7){
                await Users.listarPorId(decoded.id, function(err, result){
                    if(err){
                        res.status(500).send(err);
                    }else{
                        res.send(result);
                    }
                });
            }else{
                res.status(403).send("Não tem permissões para aceder à informação de outro utilizador!")
            }
        }else{
            res.status(403).send(err);
        }
    });
});

router.get('/verificaToken', Auth.isLoggedInUser, async function(req,res){
    res.send(req.user);
});

router.post('/registar', Auth.isLoggedInUser, Auth.checkLevel(5), function (req, res) {
    var internal = (req.body.type > 1);
    var newUser = new User({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        entidade: 'ent_'+req.body.entidade,
        internal: internal,
        level: req.body.type,
        local: {
            password: req.body.password
        }
    });
    
    Users.getUserByEmail(req.body.email, async function (err, user) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        if (!user) {
            await Users.createUser(newUser, function (err, user) {
                if (err) return res.status(500).send(`Erro: ${err}`);
            });
            res.send('Utilizador registado com sucesso!');
        }
        else {
            res.status(500).send('Email já em uso!');
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
            res.status(500).send(err)
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
            return res.status(500).send(`Erro: ${err}`);
        if (!user)
            res.status(500).send('Não existe nenhum utilizador registado com esse email!');
        else{
            Users.getUserById(user._id, function(err, user){
                if(err) 
                    return res.status(500).send(`Erro: ${err}`);
                if(user.local.password != undefined){
                    var token = Auth.generateTokenEmail(user);
                    Mailer.sendEmailRecuperacao(req.body.email, req.body.url.split('/recuperacao')[0]+'/alteracaoPassword?jwt='+token);
                    res.send('Email enviado com sucesso!')
                }else{
                    res.status(500).send('Este utilizador foi registado na plataforma CLAV através do Cartão de Cidadão, não existindo uma password para o mesmo!')
                }
            })
        }
    });
});

router.put('/desativar/:id', Auth.isLoggedInUser, Auth.checkLevel(6), async function(req, res) {
    if(req.user.id != req.params.id){
        Users.desativar(req.params.id, function(err, user){
            if(err){
                return res.status(500).send(`Erro: ${err}`);
            }else{
                res.send('Utilizador desativado com sucesso!');
            }
        })
    }else{
        res.status(500).send('Não pode desativar o seu próprio utilizador!');
    }
});

router.delete('/eliminar/:id', Auth.isLoggedInUser, Auth.checkLevel(6), async function(req, res) {
    if(req.user.id != req.params.id){
        Users.eliminar(req.params.id, function(err, user){
            if(err){
                return res.status(500).send(`Erro: ${err}`);
            }else{
                res.send('Utilizador eliminado com sucesso!');
            }
        })
    }else{
        res.status(500).send('Não pode eliminar o seu próprio utilizador!');
    }
});

//Funcoes de alteracao de utilizador
router.put('/alterarNivel/:id', Auth.isLoggedInUser, function (req, res) {
    if(req.params.id == req.user.id || req.user.level >= 6){
        Users.atualizarNivel(req.params.id, req.body.level, function (err, cb) {
            if (err) 
                return res.status(500).send(`Erro: ${err}`);
            else {
                res.send('Nivel atualizado com sucesso!')
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para alterar a informação de outro utilizador!")
    }
});

router.put('/alterarNome/:id', Auth.isLoggedInUser, function (req, res) {
    if(req.params.id == req.user.id || req.user.level >= 6){
        Users.atualizarNome(req.params.id, req.body.nome, function (err, cb) {
            if (err) 
                return res.status(500).send(`Erro: ${err}`);
            else {
                res.send('Nome atualizado com sucesso!')
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para alterar a informação de outro utilizador!")
    }
});

router.put('/alterarEmail/:id', Auth.isLoggedInUser, function (req, res) {
    if(req.params.id == req.user.id || req.user.level == 7){
        Users.atualizarEmail(req.params.id, req.body.email, function (err, cb) {
            if (err) 
                return res.status(500).send(`Erro: ${err}`);
            else {
                res.send('Email atualizado com sucesso!')
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para alterar a informação de outro utilizador!")
    }
});

router.put('/alterarPassword/:id', Auth.isLoggedInUser, function (req, res) {
    if(req.params.id == req.user.id || req.user.level == 7){
        Users.atualizarPassword(req.params.id, req.body.password, function (err, cb) {
            if (err) 
                return res.status(500).send(`Erro: ${err}`);
            else {
                res.send('Password atualizada com sucesso!')
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para alterar a informação de outro utilizador!")
    }
});

router.put('/atualizarMultiplos/:id', Auth.isLoggedInUser, function (req, res) {
    if(req.params.id == req.user.id || req.user.level == 7){
        Users.getUserByEmail(req.body.email, function(err,user){
            if(user && req.params.id != user._id){
                res.status(500).send('Já existe utilizador registado com esse email!');
            }else{
                Users.atualizarMultiplosCampos(req.params.id, req.body.nome, req.body.email, req.body.entidade, req.body.level, function (err, cb) {
                    if (err) 
                        return res.status(500).send(`Erro: ${err}`);
                    else {
                        res.send('Utilizador atualizado com sucesso!')
                    }
                });
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para alterar a informação de outro utilizador!")
    }
});

router.get('/:id', Auth.isLoggedInUser, (req, res) => {
    if(req.params.id == req.user.id || req.user.level == 7){
        Users.listarPorId(req.params.id,function(err, result){
            if(err){
                return res.status(500).send(`Erro: ${err}`);
            }else{
                return res.json(result);
            }
        });
    }else{
        return res.status(403).send("Não tem permissões para aceder à informação de outro utilizador!")
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
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        if (!user) {
            Users.getUserByEmail(req.body.email, function(err, user){
                if (err) 
                    return res.status(500).send(`Erro: ${err}`);
                if (!user) {
                    Users.createUser(newUser, function (err, user) {
                        Logging.logger.info('Utilizador ' + user._id + ' registado.');
                        if (err) return res.status(500).send(`Erro: ${err}`);
                    });
                    res.send('Utilizador registado com sucesso!');
                }else{
                    res.status(500).send('Email já em uso!');
                }
            })
        }
        else {
            res.status(500).send('Utilizador já registado!');
        }
    });
});

module.exports = router;
