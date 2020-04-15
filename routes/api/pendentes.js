var Auth = require('../../controllers/auth.js');
var Pendentes = require('../../controllers/api/pendentes');
var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe, estaEm, eMongoId, vcPendenteTipo, vcPendenteAcao } = require('../validation')

router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    Pendentes.listarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pendentes: ${erro}`));
});

router.get('/:id', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao recuperar trabalho pendente: ${erro}`));
})

// Guardar um trabalho pendente
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    estaEm('body', 'tipo', vcPendenteTipo),
    estaEm('body', 'acao', vcPendenteAcao),
    existe('body', 'criadoPor')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'numInterv')
        .bail()
        .isInt({min: 0})
        .withMessage("Não é um número inteiro maior ou igual 0"),
    existe('body', 'dataCriacao')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida")
        .optional(),
    existe('body', 'dataAtualizacao')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida")
        .optional(),
    existe('body', 'objeto')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao guardar trabalho pendente: ${erro}`));
})

// Atualizar um trabalho previamente guardado como pendente: UPDATE
router.put('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    eMongoId('body', '_id'),
    existe('body', 'objeto'),
    existe('body', 'numInterv')
        .bail()
        .isInt({min: 0})
        .withMessage("Não é um número inteiro maior ou igual 0")
        .optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.atualizar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao atualizar trabalho pendente: ${erro}`));
})

// Apaga um trabalho pendente
router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.apagar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de um trabalho pendente ' ${req.params.id}': ${erro}`));
})

module.exports = router;
