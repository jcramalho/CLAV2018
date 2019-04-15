var express = require('express');
var router = express.Router();

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

module.exports = router;