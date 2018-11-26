var Auth = require('../../controllers/auth.js');
var Leg = require('../../controllers/api/leg.js');

var express = require('express');
var router = express.Router();

// Lista todos os doucmentos legislativos: id, data, numero, tipo, sumario, entidades
router.get('/', (req, res) => {
    return Leg.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades: ${erro}`));
});

// Criação de uma nova legislacao. Em caso de sucesso gera um novo pedido
router.post('/', Auth.isLoggedIn, (req, res) => {
    const legislacao = {
        titulo: req.body.titulo,
        data: req.body.data,
        numero: req.body.numero,
        tipo: req.body.tipo,
        link: req.body.link,
        entidades: req.body.entidades,
    };

    return Leg.criar(legislacao, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da legislação: ${erro}`));
});

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', (req, res) => {
    return Leg.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`));
});

// Apaga uma legislação identificada por um identificador. Em caso de sucesso gera um novo pedido
router.delete('/:id', (req, res) => {
    return Leg.apagar(req.params.id, req.user.email)
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