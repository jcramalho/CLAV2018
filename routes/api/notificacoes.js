var Notificacao = require('../../controllers/api/notificacoes.js')
var Auth = require('../../controllers/auth.js');

var express = require('express');
var router = express.Router();

// Devolve das notificações do user atual
router.get('/', Auth.isLoggedInKey, (req, res) => {
    Notificacao.getByUser(req.user.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.user.id}: ${erro}`))
})

// Cria uma nova notificação
router.post('/', Auth.isLoggedInKey, (req, res) => {
    Notificacao.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da notificação: ${erro}`))
})

// Apaga o id de uma notificação da lista de notificações do user atual (user atualiza a notificação para ficar como "vista")
router.delete('/:idNotificacao', Auth.isLoggedInKey, (req, res) => {
    Notificacao.vista(req.user.id, req.params.idNotificacao)  
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção da notificação: ${erro}`))
})

module.exports = router;
