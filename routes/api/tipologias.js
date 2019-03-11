var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Tipologias = require('../../controllers/api/tipologias.js');

var express = require('express');
var router = express.Router();

// Middleware de verificação de disponibilidade de uma tipologia
const estaDisponivel = (req, res, next) => {
    const tipologia = {
        sigla: req.body.sigla,
        designacao: req.body.designacao,
    };

    Tipologias.existe(tipologia)
        .then(function(existe) {
            if (existe) {
                res.status(409).send(`Já existe uma tipologia com a sigla '${tipologia.sigla}' ou designação '${tipologia.designacao}'`);
            } else {
                next();
            }
        })
};

// Lista todas as tipologias: id, sigla, designacao
router.get('/', (req, res) => {
    const filtro = {
        estado: req.query.estado ? req.query.estado : "Ativa",
        designacao: req.query.designacao,
    };

    return Tipologias.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das tipologias: ${erro}`));
});

// Criação de uma nova tipologia. Em caso de sucesso gera um novo pedido
router.post('/', Auth.isLoggedIn, estaDisponivel, (req, res) => {
    return Tipologias.criar(req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da tipologia: ${erro}`));
});

// Consulta de uma tipologia: sigla, designacao, estado
router.get('/:id', (req, res) => {
    return Tipologias.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A tipologia '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta da tipologia '${req.params.id}': ${erro}`));
});

// Apaga uma tipologia identificada por uma sigla. Em caso de sucesso gera um novo pedido
router.delete('/:id', Auth.isLoggedIn, (req, res) => {
    return Tipologias.apagar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção da tipologia '${req.params.id}': ${erro}`));
})

// Lista as entidades que pertencem à tipologia: sigla, designacao, id
router.get('/:id/elementos', (req, res) => {
    return Tipologias.elementos(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consula dos elementos da tipologia '${req.params.id}': ${erro}`));
});

// Lista os processos em que uma tipologia intervem como dono
router.get('/:id/intervencao/dono', (req, res) => {
    return Tipologias.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`));
});

// Lista os processos em que uma tipologia intervem como participante
router.get('/:id/intervencao/participante', (req, res) => {
    return Tipologias.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`));
});

router.put('/:id', Auth.isLoggedIn, (req, res) => {
    return Tipologias.alterar(req.params.id, req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na alteração da Tipologia '${req.params.id}': ${erro}`));
})

/*router.put('/:id', Auth.isLoggedIn, function (req, res) {
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

})*/

module.exports = router;