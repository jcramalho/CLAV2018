var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

// Lista todos os pedidos
router.get('/', (req, res) => {
    Pedidos.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pedidos: ${erro}`));
});

// Consulta de um pedido
router.get('/:codigo', (req, res) => {
    Pedidos.consultar(req.params.codigo)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta do pedido: ${erro}`));
});

module.exports = router;