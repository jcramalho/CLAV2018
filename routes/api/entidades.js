var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Entidades = require('../../controllers/api/entidades.js');

var express = require('express');
var router = express.Router();

router.get('/erro', (req, res) => res.jsonp({cod: "Código do Erro", mensagem: "Mensagem de erro."}));

// Lista todas as entidades: id, sigla, designacao, internacional
router.get('/', (req, res) => {
    Entidades.listar()      
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "408", mensagem: `Erro na listagem das entidades: ${erro}`}))
});

// Consulta de uma entidade: sigla, designacao, estado, internacional
router.get('/:id', (req, res) => {
    Entidades.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.jsonp({cod: "404", mensagem: `Erro. A entidade '${req.params.id}' não existe`}))
        .catch(erro => res.jsonp({cod: "408", mensagem: `Erro na consulta da entidade '${req.params.id}': ${erro}`}))
});

// Lista as tipologias a que uma entidade pertence: id, sigla, designacao
router.get('/:id/tipologias', (req, res) => {
    Entidades.tipologias(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "408", mensagem: `Erro na consulta das tipologias a que '${req.params.id}' pertence: ${erro}`}))
});

// Lista os processos em que uma entidade intervem como dono
router.get('/:id/intervencao/dono', (req, res) => {
    Entidades.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "408", mensagem: `Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`}))
});

// Lista os processos em que uma entidade intervem como participante
router.get('/:id/intervencao/participante', (req, res) => {
    Entidades.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp({cod: "408", mensagem: `Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`}))
});

module.exports = router;

/*

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

module.exports = router;*/