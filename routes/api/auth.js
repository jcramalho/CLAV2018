var express = require('express');
var router = express.Router();
var AuthCall = require('../../models/auth')
var AuthCalls = require('../../controllers/api/auth');

router.get('/:id', (req, res) => {
    AuthCalls.get(req.params.id,function(err, call){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(call);
        }
    });
})

router.post('/adicionar', (req, res) => {
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
