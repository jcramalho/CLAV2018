var express = require('express');
var Logging = require('../../controllers/logging');
var router = express.Router();
var passport = require('passport');
var User = require('../../models/user');
var Users = require('../../controllers/api/users');
var AuthCalls = require('../../controllers/api/auth');
var jwt = require('jsonwebtoken');
var secretKey = require('./../../config/app');
var Mailer = require('../../controllers/api/mailer');
var mongoose = require('mongoose');

router.get('/', (req, res) => {
    Users.listar(req,function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});

router.get('/listarEmail/:id', function(req, res) {
    Users.listarEmail(req.params.id,function(err, email){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(email);
        }
    });
});

router.get('/listarToken/:id', async function(req,res){
    await jwt.verify(req.params.id, secretKey.key, async function(err, decoded){
        if(!err){
            console.log(decoded)
            await Users.listarPorId(decoded.id,function(err, result){
                if(err){
                    res.status(500).send(err);
                }else{
                    res.send(result);
                }
            });
        }else{
            res.status(500).send(err);
        }
    });
});

router.get('/verificaToken/:id', async function(req,res){
    await jwt.verify(req.params.id, secretKey.key, async function(err, decoded){
        if(!err){
            res.send(decoded);
        }else{
            res.status(500).send(err);
        }
    });
});

router.post('/registar', function (req, res) {
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
                Logging.logger.info('Utilizador ' + user._id + ' registado.');
                if (err) return res.status(500).send(`Erro: ${err}`);
            });
            res.send('Utilizador registado com sucesso!');
        }
        else {
            res.status(500).send('Email já em uso!');
        }
    });
});

router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            res.status(500).send(err)
        if (!user)
            res.status(500).send('Credenciais inválidas')
        else{
            req.login(user, () => {
                var token = jwt.sign({id: user._id}, secretKey.key, {expiresIn: '8h'});
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
                    var token = jwt.sign({id: user._id}, secretKey.key, {expiresIn: '30m'});
                    Mailer.sendEmailRecuperacao(req.body.email, req.body.url.split('/recuperacao')[0]+'/alteracaoPassword?jwt='+token);
                    res.send('Email enviado com sucesso!')
                }else{
                    res.status(500).send('Este utilizador foi registado na plataforma CLAV através do Cartão de Cidadão, não existindo uma password para o mesmo!')
                }
            })
        }
    });
});

router.put('/desativar', async function(req, res) {
    await jwt.verify(req.body.token, secretKey.key, async function(err, decoded){
        if(decoded.id != req.body.id){
            Users.desativar(req.body.id, function(err, user){
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
});

router.delete('/eliminar', async function(req, res) {
    await jwt.verify(req.body.token, secretKey.key, async function(err, decoded){
        if(decoded.id != req.body.id){
            Users.eliminar(req.body.id, function(err, user){
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
});

//Funcoes de alteracao de utilizador
router.put('/alterarNivel', function (req, res) {
    Users.atualizarNivel(req.body.id, req.body.level, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Nivel atualizado com sucesso!')
        }
    });
});

router.put('/alterarNome', function (req, res) {
    Users.atualizarNome(req.body.id, req.body.nome, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Nome atualizado com sucesso!')
        }
    });
});

router.put('/alterarEmail', function (req, res) {
    Users.atualizarEmail(req.body.id, req.body.email, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Email atualizado com sucesso!')
        }
    });
});

router.put('/alterarPassword', function (req, res) {
    Users.atualizarPassword(req.body.id, req.body.password, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Password atualizada com sucesso!')
        }
    });
});

router.put('/atualizarMultiplos', function (req, res) {
    Users.getUserByEmail(req.body.email, function(err,user){
        if(user){
            res.status(500).send('Já existe utilizador registado com esse email!');
        }else{
            Users.atualizarMultiplosCampos(req.body.id, req.body.nome, req.body.email, req.body.entidade, req.body.level, function (err, cb) {
                if (err) 
                    return res.status(500).send(`Erro: ${err}`);
                else {
                    res.send('Utilizador atualizado com sucesso!')
                }
            });
        }
    });
});

//API calls
// router.get('/contarChamadasApi', async function (req, res) {
//     await Users.contarChamadasApi(function(err, count){
//         if(err){
//             return res.status(500).send(`Erro: ${err}`);
//         }else{
//             return res.json(count);
//         }
//     });
// });

// router.post('/adicionarChamadaApi/:id', function (req, res) {
//     Users.adicionarChamadaApi(req.params.id, function (err, cb) {
//         if (err) return res.status(500).send(`Erro: ${err}`);
//     });
// });

router.get('/:id', (req, res) => {
    Users.listarPorId(req.params.id,function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
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
                        var token = jwt.sign({id: user._id}, secretKey.key, {expiresIn: '8h'});
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
router.post('/registarCC', function (req, res) {
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
