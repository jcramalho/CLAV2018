var express = require('express');
var router = express.Router();
var AuthCall = require('../../models/auth')
var AuthCalls = require('../../controllers/api/auth');
const { body, validationResult } = require('express-validator');
const { existe } = require('../validation')

router.get('/:id', (req, res) => {
    AuthCalls.get(req.params.id,function(err, call){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(call);
        }
    });
})

router.post('/adicionar', [
    existe('body', 'id'),
    body('url', 'Valor não é um URL').isURL({require_tld: false})
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var authCall = new AuthCall({
        _id: req.body.id,
        url: req.body.url
    })

    AuthCalls.addRedirectUrl(authCall, function (err, call) {
        if (err) return res.status(500).send(`Erro: ${err}`);
        else return res.json(call)
    });
});

// Deletes all Auth Calls
router.delete('/', (req, res) => {
    AuthCalls.removeAll()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de todos os Auth Calls: ${erro}`));
})

module.exports = router;
