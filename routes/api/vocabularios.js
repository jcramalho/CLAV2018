var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Vocabulario = require('../../controllers/api/vocabularios.js');

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    Vocabulario.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "404", mensagem: "Erro na listagem dos VC: " + erro}))
})

// Devolve a lista de termos de um VC: idtermo, termo
router.get('/:id', function (req, res) {
    Vocabulario.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "404", mensagem: "Erro na consulta do VC "+req.params.id+": " + erro}))
})

module.exports = router;