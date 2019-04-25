var express = require('express');
var router = express.Router();
var passport = require('passport')
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

router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.status(400).send([user, "Cannot log in", info])
        }
        req.login(user, (err) => {
            res.send(user)
        })
    })(req, res, next);
});

module.exports = router;