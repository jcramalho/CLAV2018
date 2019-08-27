var Auth = require('../../controllers/auth.js');
var Leg = require('../../controllers/api/leg.js');
var url = require('url');

var express = require('express');
var router = express.Router();

// Middleware de verificação de disponibilidade de uma legislação
const estaDisponivel = (req, res, next) => {
    const legislacao = {
        numero: req.body.numero,
    };

    Leg.existe(legislacao)
        .then(function(existe) {
            if (existe) {
                res.status(409).send(`Já existe uma legislação com o número '${legislacao.numero}'`);
            } else {
                next();
            }
        })
};

// Lista todos os documentos legislativos: id, data, numero, tipo, sumario, entidades
router.get('/', (req, res) => {
    var queryData = url.parse(req.url, true).query;
    // api/legislacao?estado=A
    if (queryData.estado && (queryData.estado == 'A')){
        return Leg.listarAtivos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos diplomas ativos: ${erro}`));
    }
    // api/legislacao?processos=com
    if (queryData.processos && (queryData.processos == 'com')){
        return Leg.listarComPNs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos diplomas com PNs associados: ${erro}`));
    }
    // api/legislacao?processos=sem
    if (queryData.processos && (queryData.processos == 'sem')){
        return Leg.listarSemPNs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos diplomas sem PNs associados: ${erro}`));
    }
    else {
        return Leg.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem dos diplomas legislativos: ${erro}`));
    }
    
});

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', (req, res) => {
    return Leg.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A legislação '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`));
});

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get('/:id/regula', function (req, res) {
    return Leg.regula(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`));
});

module.exports = router;
