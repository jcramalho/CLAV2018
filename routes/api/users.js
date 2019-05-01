var express = require('express');
var Logging = require('../../controllers/logging');
var router = express.Router();
var passport = require('passport');
var User = require('../../models/user');
var Users = require('../../controllers/api/users');

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

router.post('/registar', function (req, res) {
    console.log(JSON.stringify(req.body))
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
        else
            req.login(user, (err) => {res.send(user)})
    })(req, res, next);
});

module.exports = router;