var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Entidades = require('../../controllers/api/entidades.js');
var url = require('url');

var express = require('express');
var router = express.Router();

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
    // api/entidades?processos=com
    if (queryData.processos && (queryData.processos == 'com')){
        return Entidades.listarComPNs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das entidades com PNs associados: ${erro}`));
    }
    // api/entidades?processos=sem
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
