var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

// Lista todos os pedidos que statisfazem uma condição
router.get('/', (req, res) => {
    if(req.query.tipo){
        Pedidos.getByTipo(req.query.tipo)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na listagem de pedidos por tipo: ${erro}`));
    }
    else{
        const filtro = {
            criadoPor: req.query.criadoPor,
            'objeto.codigo': req.query.objeto,
            'objeto.tipo': req.query.tipo,
            'objeto.acao': req.query.acao,
        };
    
        Pedidos.listar(filtro)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na listagem de pedidos: ${erro}`));
    }
});

// Consulta de um pedido
router.get('/:codigo', (req, res) => {
    Pedidos.consultar(req.params.codigo)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta do pedido: ${erro}`));
});

// Criação de um pedido
router.post('/', (req, res) => {
    Pedidos.criar(req.body)
})

// Adição de distribuição 
router.post('/:codigo/distribuicao', (req, res) => {
    Pedidos.adicionarDistribuicao(req.params.codigo, req.body)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na distribuição do pedido: ${erro}`));
});

module.exports = router;