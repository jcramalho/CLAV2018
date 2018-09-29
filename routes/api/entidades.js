var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Entidades = require('../../controllers/api/entidades.js');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    Entidades.list()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error("Chamada a Listagem: " + error);
        });
})

router.get('/:id', function (req, res) {
    Entidades.stats(req.params.id)
        .then(stats => res.send(stats))
        .catch(function (error) {
            console.error("Chamada de dados de uma org: " + error);
        });
})

router.get('/:id/tipologias', function (req, res) {
    Entidades.inTipols(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error("Chamada de tipologias a que x pertence: " + error);
        });
})

router.get('/:id/dominio', function (req, res) {
    Entidades.domain(req.params.id)
        .then(org => res.send(org))
        .catch(function (error) {
            console.error("Chamada de dominio: " + error);
        });
})

router.get('/:id/participacoes', function (req, res) {
    Entidades.participations(req.params.id)
        .then(org => res.send(org))
        .catch(function (error) {
            console.error("Chamada de participações: " + error);
        });
})

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var initials = req.body.initials;
    var international = req.body.international;
    var name = req.body.name;
    var tipologias = req.body.tipologias
    var id = 'ent_'+initials;

    Entidades.checkAvailability(name, initials)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação e/ou Sigla já existente(s)!");
            }
            else {
                Entidades.createEntidade(id, name, initials, international, tipologias)
                    .then(function () {
                        Logging.logger.info('Criada entidade \'' + id + '\' por utilizador \'' + req.user._id + '\'');

                        req.flash('success_msg', 'Entidade adicionada');
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
    Entidades.checkAvailability(dataObj.name)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação já existentente!");
            }
            else {
                Entidades.updateEntidade(dataObj)
                    .then(function () {
                        Logging.logger.info('Update a entidade \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

                        req.flash('success_msg', 'Info. de Entidade atualizada');
                        res.send(dataObj.id);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("Initials error:\n" + error));

})

router.delete('/:id', Auth.isLoggedInAPI, function (req, res) {
    Entidades.deleteEntidade(req.params.id)
        .then(function () {
            Logging.logger.info('Desativada entidade \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Entrada desativada');
            res.send("Entrada desativada!");
        })
        .catch(function (error) {
            console.error(error);
        });
})

module.exports = router;