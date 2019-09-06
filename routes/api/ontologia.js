var Auth = require('../../controllers/auth.js');
var Ontologia = require('../../controllers/api/ontologia.js');

var express = require('express');
var router = express.Router();

router.get('/data', (req, res) => {
    Ontologia.data()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.get('/descricao', (req, res) => {
    Ontologia.descricao()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

module.exports = router;
