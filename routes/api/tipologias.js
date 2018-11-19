var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Tipologias = require('../../controllers/api/tipologias.js');

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    return Tipologias.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das tipologias: ${erro}`));
})

router.get('/:id', (req, res) => {
    return Tipologias.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A tipologia '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta da tipologia '${req.params.id}': ${erro}`));
});

router.get('/:id/elementos', (req, res) => {
    return Tipologias.elementos(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consula dos elementos da tipologia '${req.params.id}': ${erro}`));
});

router.get('/:id/intervencao/dono', (req, res) => {
    return Tipologias.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`));
});

router.get('/:id/intervencao/participante', (req, res) => {
    return Tipologias.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`));
});

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var initials = req.body.initials;
    var name = req.body.name;
    var id = 'tip_'+initials;

    Tipologias.checkAvailability(name, initials)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação e/ou Sigla já existente(s)!");
            }
            else {
                Tipologias.createTipologia(id, name, initials)
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
                Tipologias.updateTipologia(dataObj)
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
    Tipologias.deleteTipologia(req.params.id)
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