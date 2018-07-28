var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Tipologias = require('../../controllers/api/tipologias.js');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    Tipologias.list()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error("Chamada a Listagem: " + error);
        });
})

router.get('/:id', function (req, res) {
    Tipologias.stats(req.params.id)
        .then(stats => res.send(stats))
        .catch(function (error) {
            console.error("Chamada de dados de uma org: " + error);
        });
})

router.get('/:id/elementos', function (req, res) {
    Tipologias.elems(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error("Chamada de elementos de x: " + error);
        });
})

router.get('/:id/dominio', function (req, res) {
    Tipologias.domain(req.params.id)
        .then(org => res.send(org))
        .catch(function (error) {
            console.error("Chamada de dominio: " + error);
        });
})

router.get('/:id/participacoes', function (req, res) {
    Tipologias.participations(req.params.id)
        .then(org => res.send(org))
        .catch(function (error) {
            console.error("Chamada de participações: " + error);
        });
})

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var initials = req.body.initials;
    var name = req.body.name;
    var id = 'ent_'+initials;

    Tipologias.checkAvailability(name, initials)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação e/ou Sigla já existente(s)!");
            }
            else {
                Tipologias.createEntidade(id, name, initials)
                    .then(function () {
                        Logging.logger.info('Criada tipologia \'' + id + '\' por utilizador \'' + req.user._id + '\'');

                        req.flash('success_msg', 'Tipologia adicionada');
                        res.send(id);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("General error:\n" + error));
})

router.put('/:id', Auth.isLoggedInAPI, function (req, res) {
    var dataObj = req.body;

    //Executing queries
    Tipologias.checkAvailability(dataObj.name)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação já existentente!");
            }
            else {
                Tipologias.updateEntidade(dataObj)
                    .then(function () {
                        Logging.logger.info('Update a tipologia \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

                        req.flash('success_msg', 'Info. de Tipologia atualizada');
                        res.send(dataObj.id);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("Name error:\n" + error));

})

router.delete('/:id', Auth.isLoggedInAPI, function (req, res) {
    Tipologias.deleteEntidade(req.params.id)
        .then(function () {
            Logging.logger.info('Desativada tipologia \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Entrada desativada');
            res.send("Entrada desativada!");
        })
        .catch(function (error) {
            console.error(error);
        });
})

module.exports = router;