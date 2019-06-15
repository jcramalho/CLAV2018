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

// Criação de uma nova legislacao. Em caso de sucesso gera um novo pedido
router.post('/', Auth.isLoggedInNEW, estaDisponivel, (req, res) => {
    return Leg.criar(req.body, req.body.token)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da legislação: ${erro}`));
});

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', (req, res) => {
    return Leg.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A legislação '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`));
});

// Alteração de Legislação
router.put('/:id', Auth.isLoggedIn, (req, res) => {
    return Leg.alterar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na alteração da legislação '${req.params.id}': ${erro}`));
})

// Apaga uma legislação identificada por um identificador. Em caso de sucesso gera um novo pedido
router.delete('/:id', (req, res) => {
    return Leg.apagar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção da legislação '${req.params.id}': ${erro}`));
});

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get('/:id/regula', function (req, res) {
    return Leg.regula(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`));
});

/*
router.put('/:id', function (req, res) {
    var dataObj = req.body;

    if (dataObj.number) {
        Leg.checkNumberAvailability(dataObj.number)
            .then(function (count) {
                if (count > 0) {
                    res.send("Número já existente!");
                }
                else {
                    Leg.updateDoc(dataObj)
                        .then(function () {
                            Logging.logger.info('Update a Diploma \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

                            req.flash('success_msg', 'Info. de Diploma actualizada');
                            res.send("Actualizado!");
                        })
                        .catch(error => console.error(error));
                }
            })
            .catch(error => console.error("Check error:\n" + error));
    }
    else {
        Leg.updateDoc(dataObj)
            .then(function () {
                Logging.logger.info('Update a Diploma \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

                req.flash('success_msg', 'Informação de Diploma actualizada');
                res.send("Actualizado!");
            })
            .catch(error => console.error(error));
    }
});*/

module.exports = router;