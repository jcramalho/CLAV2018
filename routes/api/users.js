var express = require('express');
var Logging = require('../../controllers/logging');
var router = express.Router();
var passport = require('passport');
var User = require('../../models/user');
var Users = require('../../controllers/api/users');
var jwt = require('jsonwebtoken')
var secretKey = require('./../../config/app');
var Mailer = require('../../controllers/api/mailer')

router.get('/', (req, res) => {
    Users.listar(req,function(err, result){
        if(err){
            throw err;
        }else{
            return res.json(result);
        }
    });
});

router.get('/:id', (req, res) => {
    console.log(req.params.id)
    Users.listarPorId(req.params.id,function(err, result){
        if(err){
            throw err;
        }else{
            return res.json(result);
        }
    });
});

router.get('/listarEmail/:id', function(req, res) {
    Users.listarEmail(req.params.id,function(err, email){
        if(err){
            throw err;
        }else{
            return res.json(email);
        }
    });
});

router.get('/listarToken/:id', async function(req,res){
    await jwt.verify(req.params.id, secretKey.key, async function(err, decoded){
        if(!err){
            await Users.listarPorId(decoded.id,function(err, result){
                if(err){
                    res.send(err);
                }else{
                    res.send(result);
                }
            });
        }else{
            res.send(err);
        }
    });
});

router.get('/verificaToken/:id', async function(req,res){
    await jwt.verify(req.params.id, secretKey.key, async function(err, decoded){
        if(!err){
            res.send(decoded);
        }else{
            res.send(err);
        }
    });
});

router.post('/registar', function (req, res) {
    var internal = (req.body.type > 1);
    var newUser = new User({
        name: req.body.name,
        email: req.body.email,
        entidade: 'ent_'+req.body.entidade,
        internal: internal,
        level: req.body.type,
        local: {
            password: req.body.password
        }
    });
    
    Users.getUserByEmail(req.body.email, function (err, user) {
        if (err) 
            throw err;
        if (!user) {
            Users.createUser(newUser, function (err, user) {
                Logging.logger.info('Utilizador ' + user._id + ' registado.');
                if (err) throw err;
            });
            res.send('Utilizador registado com sucesso!');
        }
        else {
            res.send('Email já em uso!');
        }
    });
});

router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            res.send(err)
        if (!user)
            res.send('Credenciais inválidas')
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
            throw err;
        if (!user)
            res.send('Não existe utilizador com esse email!');
        else {
            var token = jwt.sign({id: user._id}, secretKey.key, {expiresIn: '30m'});
            Mailer.sendEmail(req.body.email, req.body.url.split('/recuperacao')[0]+'/alteracaoPassword?jwt='+token);
            res.send('Email enviado com sucesso!')
        }
    });
});

router.post('/desativar', async function(req, res) {
    await jwt.verify(req.body.token, secretKey.key, async function(err, decoded){
        if(decoded.id != req.body.id){
            Users.desativar(req.body.id, function(err, user){
                if(err){
                    throw err;
                }else{
                    res.send('Utilizador desativado com sucesso!');
                }
            })
        }else{
            res.send('Não pode desativar o seu próprio utilizador!');
        }
    });
});

router.post('/eliminar', async function(req, res) {
    await jwt.verify(req.body.token, secretKey.key, async function(err, decoded){
        if(decoded.id != req.body.id){
            Users.eliminar(req.body.id, function(err, user){
                if(err){
                    throw err;
                }else{
                    res.send('Utilizador eliminado com sucesso!');
                }
            })
        }else{
            res.send('Não pode eliminar o seu próprio utilizador!');
        }
    });
});

//Funcoes de alteracao de utilizador
router.post('/alterarNivel', function (req, res) {
    Users.atualizarNivel(req.body.id, req.body.level, function (err, cb) {
        if (err) 
            throw err;
        else {
            res.send('Nivel atualizado com sucesso!')
        }
    });
});

router.post('/alterarNome', function (req, res) {
    Users.atualizarNome(req.body.id, req.body.nome, function (err, cb) {
        if (err) 
            throw err;
        else {
            res.send('Nome atualizado com sucesso!')
        }
    });
});

router.post('/alterarEmail', function (req, res) {
    Users.atualizarEmail(req.body.id, req.body.email, function (err, cb) {
        if (err) 
            throw err;
        else {
            res.send('Email atualizado com sucesso!')
        }
    });
});

router.post('/alterarPassword', function (req, res) {
    Users.atualizarPassword(req.body.id, req.body.password, function (err, cb) {
        if (err) 
            throw err;
        else {
            res.send('Password atualizada com sucesso!')
        }
    });
});

router.post('/atualizarMultiplos', function (req, res) {
    Users.atualizarMultiplosCampos(req.body.id, req.body.nome, req.body.email, req.body.level, function (err, cb) {
        if (err) 
            throw err;
        else {
            res.send('Utilizador atualizado com sucesso!')
        }
    });
});

module.exports = router;