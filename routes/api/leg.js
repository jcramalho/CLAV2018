var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Leg = require('../../controllers/api/leg.js');

var express = require('express');
var router = express.Router();

// Lista todos os doucmentos legislativos: id, data, numero, tipo, sumario, entidades
router.get('/', (req, res) => {
    Leg.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades: ${erro}`));
})

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', (req, res) => {
    Leg.consultar(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`));
})

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get('/:id/regula', function (req, res) {
    Leg.regula(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`));
})

// Devolve o número de documentos legislativos catalogados para efeitos de geração dum novo id ou de contagem
router.get('/numElems', (req, res) => {
    Leg.ultNum()
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na contagem dos documentos: ${erro}`));
})


router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var dataObj = req.body;

    Leg.checkNumberAvailability(dataObj.Number)
        .then(function (count) {
            if (count > 0) {
                res.send("Número já existente!");
            }
            else {
                Leg.ultNum()
                    .then(legId => {
                        console.log("ID recebido: " + legId)
                        var novoID = "leg_" + parseInt(legId.split("leg_")) + 1
                        console.log("Leg: " + novoID)
                    
                        Leg.createDoc(novoID, dataObj)
                            .then(function () {
                                Logging.logger.info('Criada legislação \'' + novoID + '\' por utilizador \'' + req.user._id + '\'');

                                req.flash('success_msg', 'Diploma inserido');
                                res.send(novoID);
                            })
                            .catch(error => console.error(error))
                        }) 
                    .catch(error => console.error('Legislação: Erro na contagem do catálogo: ' + error))  
            }
        })
        .catch(error => console.error("Legislação: Erro na verificação do número da legislação: " + error));
})

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
})

router.delete('/:id', Auth.isLoggedInAPI, function (req, res) {
    Leg.deleteDoc(req.params.id)
        .then(function () {
            Logging.logger.info('Desativada Legislação \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Entrada desativada');
            res.send("Entrada desativada!");
        })
        .catch(function (error) {
            console.error(error);
        });
})

module.exports = router;