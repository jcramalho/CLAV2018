var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Entidades = require('../../controllers/api/entidades.js');
var url = require('url');

var express = require('express');
var router = express.Router();

const axios = require('axios');
const myhost = require('./../../config/database').host

// Middleware de verificação de disponibilidade de uma entidade
const estaDisponivel = (req, res, next) => {
    const entidade = {
        sigla: req.body.sigla,
        designacao: req.body.designacao,
    };

    Entidades.existe(entidade)
        .then(function(existe) {
            if (existe) {
                res.status(409).send(`Já existe uma entidade com a sigla '${entidade.sigla}' ou designação '${entidade.designacao}'`);
            } else {
                next();
            }
        })
};

// Lista todas as entidades: id, sigla, designacao, internacional
router.get('/', (req, res) => {
    var queryData = url.parse(req.url, true).query;
    // api/legislacao?processos=com
    if (queryData.processos && (queryData.processos == 'com')){
        return Entidades.listarComPNs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades com PNs associados: ${erro}`));
    }
    // api/legislacao?processos=sem
    if (queryData.processos && (queryData.processos == 'sem')){
        return Entidades.listarSemPNs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades sem PNs associados: ${erro}`));
    }
    else {
        return Entidades.listar(req.query)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades: ${erro}`));
    }
        
});

// Criação de uma nova entidade. Em caso de sucesso gera um novo pedido
router.post('/', Auth.isLoggedInNEW, estaDisponivel, (req, res) => {
    return Entidades.criar(req.body, req.body.token)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da entidade: ${erro}`));
});

// Consulta de uma entidade: sigla, designacao, estado, internacional
router.get('/:id', (req, res) => {
    return Entidades.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A entidade '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta da entidade '${req.params.id}': ${erro}`));
});

router.put('/:id', Auth.isLoggedIn, (req, res) => {
    return Entidades.alterar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na alteração da entidade '${req.params.id}': ${erro}`));
})

// Apaga uma entidade identificada por uma sigla. Em caso de sucesso gera um novo pedido
router.delete('/:id', Auth.isLoggedIn, (req, res) => {
    return Entidades.apagar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção da entidade '${req.params.id}': ${erro}`));
});

// Lista as tipologias a que uma entidade pertence: id, sigla, designacao
router.get('/:id/tipologias', (req, res) => {
    return Entidades.tipologias(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das tipologias a que '${req.params.id}' pertence: ${erro}`));
});

// Lista os processos em que uma entidade intervem como dono
router.get('/:id/intervencao/dono', (req, res) => {
    return Entidades.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`));
});

// Lista os processos em que uma entidade intervem como participante
router.get('/:id/intervencao/participante', (req, res) => {
    return Entidades.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`));
});

module.exports = router;

/*
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
*/