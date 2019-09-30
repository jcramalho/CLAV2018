var express = require('express');
var router = express.Router();
var Auth = require('../../controllers/auth.js');
var AuthCall = require('../../models/auth')
var AuthCalls = require('../../controllers/api/auth');

router.get('/:id', Auth.isLoggedInKey, (req, res) => {
    AuthCalls.get(req.params.id,function(err, call){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(call);
        }
    });
})

router.post('/adicionar', Auth.isLoggedInKey, (req, res) => {
    var authCall = new AuthCall({
        _id: req.body.id,
        url: req.body.url
    })

    AuthCalls.addRedirectUrl(authCall, function (err, call) {
        if (err) return res.status(500).send(`Erro: ${err}`);
        else return res.json(call)
    });
});


module.exports = router;
