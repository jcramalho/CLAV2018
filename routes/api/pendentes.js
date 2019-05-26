var Auth = require('../../controllers/auth.js');
var Pendentes = require('../../controllers/api/pendentes');
var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    Pendentes.listarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pendentes: ${erro}`));
});

// Guardar um trabalho pendente
router.post('/', Auth.isLoggedInNEW, (req, res) => {
    Pendentes.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao guardar trabalho pendente: ${erro}`));
})

module.exports = router;