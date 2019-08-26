var Auth = require('../../controllers/auth.js');
var Pendentes = require('../../controllers/api/pendentes');
var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    Pendentes.listarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pendentes: ${erro}`));
});

router.get('/:id', (req, res) => {
    Pendentes.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao recuperar trabalho pendente: ${erro}`));
})

// Guardar um trabalho pendente
router.post('/', Auth.isLoggedInNEW, (req, res) => {
    Pendentes.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao guardar trabalho pendente: ${erro}`));
})

// Atualizar um trabalho previamente guardado como pendente: UPDATE
router.put('/', (req, res) => {
    Pendentes.atualizar(req.body)
        .then(dados => {
            res.jsonp(dados)})
        .catch(erro => {
            console.log('\n\nERRO: ' + JSON.stringify(erro))
            res.status(500).send(`Erro ao atualizar trabalho pendente: ${erro}`)});
})

// Apaga um trabalho pendente
router.delete('/:id', (req, res) => {
    Pendentes.apagar(req.params.id, req.body)
        .then(dados => {
            res.jsonp(dados)})
        .catch(erro => {
            res.status(500).send(`Erro na remoção de um trabalho pendente ' ${req.params.id}': ${erro}`)});
})

module.exports = router;