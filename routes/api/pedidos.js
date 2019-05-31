var Auth = require('../../controllers/auth.js');
var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

// Lista todos os pedidos que statisfazem uma condição
router.get('/', (req, res) => {
    const filtro = {
        criadoPor: req.query.criadoPor,
        codigo: req.query.codigo,
        tipo: req.query.tipo,
        acao: req.query.acao,
        estado: req.query.estado
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

// Criação de um pedido
router.post('/', Auth.isLoggedInNEW, (req, res) => {
    Pedidos.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação do pedido: ${erro}`));
})

// Adição de distribuição 
router.post('/:codigo/distribuicao', (req, res) => {
    Pedidos.adicionarDistribuicao(req.params.codigo, req.body)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na distribuição do pedido: ${erro}`));
});

module.exports = router;