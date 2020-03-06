var Notificacao = require('../../controllers/api/notificacao.js')
var Auth = require('../../controllers/auth.js');

var express = require('express');
var router = express.Router();

// Devolve das notificações de um user
router.get('/', (req, res) => {
    Notificacao.getByUser(req.params.user)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.body.id}: ${erro}`))
})

// Cria uma nova notificação
router.post('/', (req, res) => {
    Notificacao.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da notificação: ${erro}`))
})

module.exports = router;
