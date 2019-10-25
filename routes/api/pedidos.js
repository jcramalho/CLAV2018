var Auth = require('../../controllers/auth.js');
var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// Lista todos os pedidos que statisfazem uma condição
router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    const filtro = {}
    if(!isEmpty(req.query)){
        const entries = Object.entries(req.query)
        for (const [key, value] of entries) {
            if(key != "token" && key != "apikey" && key != "OF")
                filtro[key] = value
        }
    }
    
    Pedidos.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pedidos: ${erro}`));
});

// Consulta de um pedido
router.get('/:codigo', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    Pedidos.consultar(req.params.codigo)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta do pedido: ${erro}`));
});

// Criação de um pedido
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    Pedidos.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação do pedido: ${erro}`));
})

// Atualização de um pedido: mais uma etapa na distribuição
router.put('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    Pedidos.atualizar(req.body.pedido._id, req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na atualização do pedido: ${erro}`));
})

// Adição de distribuição 
router.post('/:codigo/distribuicao', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    Pedidos.adicionarDistribuicao(req.params.codigo, req.body)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na distribuição do pedido: ${erro}`));
});

module.exports = router;
