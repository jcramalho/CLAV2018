var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var TermosIndice = require('../../controllers/api/termosIndice.js');
var url = require('url');

var express = require('express');
var router = express.Router();

// Middleware de verificação de disponibilidade de uma entidade
const estaDisponivel = (req, res, next) => {
    const termoIndice = {
        termo: req.body.termo,
    };

    TermosIndice.existe(termoIndice)
        .then(function(existe) {
            if (existe) {
                res.status(409).send(`Já existe um Termo de Índice com o termo '${termoIndice.termo}'.`);
            } else {
                next();
            }
        })
};

// Devolve a lista dos termos de índice ou processa uma query
router.get('/', function (req, res) {
    var queryData = url.parse(req.url, true).query;
    if (queryData.existe){
        return TermosIndice.existe(queryData.existe)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na pesquisa dum TI: ${erro}`));
    }
    else{
        return TermosIndice.listar()
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na listagem dos termos de índice: ${erro}`));
    }
})

// Devolve o número de termos na BD
router.get('/quantos', function (req, res) {
    return TermosIndice.contar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na contagem dos termos de índice: ${erro}`));
})

// Criação de um novo termo de indice. Em caso de sucesso gera um novo pedido
router.post('/', Auth.isLoggedIn, estaDisponivel, (req, res) => {
    const termoIndice = {
        termo: req.body.termo,
        idClasse: req.body.idClasse,
    };
    return TermosIndice.criar(termoIndice, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação do termo de índice: ${erro}`));
});

// Devolve a lista dos termos de índice associados a uma determinada classe
router.get('/classe/:classe', function (req, res) {
    TermosIndice.assocClasse(req.params.classe)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos termos de índice de uma classe: ${erro}`));
})

module.exports = router;