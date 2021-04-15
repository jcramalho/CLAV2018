
var Notificacoes = require('../../controllers/api/notificacoes.js')
var Auth = require('../../controllers/auth.js');

var express = require('express');
var router = express.Router();

// Devolve as notificações do user atual
router.get('/', Auth.isLoggedInKey, Notificacoes.get);

// Apaga uma notificação pelo id
router.delete('/:idNotificacao', Auth.isLoggedInKey, Notificacoes.delete);

module.exports = router;