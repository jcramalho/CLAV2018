var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

// Lista todos os pedidos que statisfazem uma condição
router.get('/', (req, res) => {
    const filtro = {
        criadoPor: req.query.criadoPor,
        'objeto.codigo': req.query.objeto,
        'objeto.tipo': req.query.tipo,
        'objeto.acao': req.query.acao,
    };

    Pedidos.listar(filtro)
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