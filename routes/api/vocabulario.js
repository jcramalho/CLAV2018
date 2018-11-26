var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Vocabulario = require('../../controllers/api/vocabulario.js');

var express = require('express');
var router = express.Router();


router.get('/formasContagemPCA', function (req, res) {
    Vocabulario.formasContagemPCA()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro no carregamento das formas de contagem do PCA: ${erro}`))
})

router.get('/subFormasContagemPCA', function (req, res) {
    Vocabulario.subFormasContagemPCA()
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro no carregamento das subformas de contagem do PCA: ${erro}`))
})

module.exports = router;