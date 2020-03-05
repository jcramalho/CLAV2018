var Notificacao = require('../../controllers/api/notificacao.js')
var Auth = require('../../controllers/auth.js');

var express = require('express');
var router = express.Router();

// Devolve das notificações de um user
router.get('/'/*, Auth.isLoggedInKey*/, (req, res) => {
    Notificacao.getByUser(req.body.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.body.id}: ${erro}`))
})

// Cria uma nova notificação
router.post('/'/*, Auth.isLoggedInKey*/, (req, res) => {
    Notificacao.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da notificação: ${erro}`))
})

module.exports = router;
