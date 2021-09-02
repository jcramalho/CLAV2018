
var Notificacoes = require('../../controllers/api/notificacoes.js')

var express = require('express');
var router = express.Router();

// Devolve as notificações do user atual
router.get('/', Notificacoes.get);

// Apaga uma notificação pelo id
router.delete('/:idNotificacao', Notificacoes.delete);

module.exports = router;