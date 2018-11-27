var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var TermosIndice = require('../../controllers/api/termosIndice.js');

var express = require('express');
var router = express.Router();

// Devolve a lista dos termos de índice
router.get('/', function (req, res) {
    return TermosIndice.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos termos de índice: ${erro}`));
})

// Devolve a lista dos termos de índice associados a uma determinada classe
router.get('/classe/:classe', function (req, res) {
    TermosIndice.assocClasse(req.params.classe)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos termos de índice de uma classe: ${erro}`));
})

module.exports = router;