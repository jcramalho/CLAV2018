var Auth = require('../../controllers/auth.js');
var Pendentes = require('../../controllers/api/pendentes');
var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe, estaEm, eMongoId, vcPendenteTipo, vcPendenteAcao } = require('../validation')

router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    let filtro = {}

    //se o nivel de utilizador é < 3.5 então devolve apenas os pendentes do utilizador
    if(req.user.level < 3.5){
        filtro["criadoPor"] = req.user.email
    }
    filtro["entidade"] = req.user.entidade

    Pendentes.listar(filtro)
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
        .then(dados => {
            if(dados){
                //se o nivel de utilizador é < 3.5 então devolve apenas os pendentes do utilizador
                if(req.user.level < 3.5 && req.user.email != dados.criadoPor){
                    res.status(403).send("Não tem permissões para aceder este pendente")
                }else{
                    res.jsonp(dados)
                }
            }else{
                res.status(404).send(`Erro. O pendente '${req.params.id}' não existe`)
            }
        })
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

    req.body.entidade = req.user.entidade;
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

    let email = null
    //se o nivel de utilizador é < 3.5 então só pode atualizar os seus pendentes
    if(req.user.level < 3.5){
        email = req.user.email
    }

    Pendentes.atualizar(req.body, email)
        .then(dados => {
            if(dados){
                //se o nivel de utilizador é < 3.5 então só pode atualizar os seus pendentes
                if(dados == "sem_permissoes") {
                    res.status(403).send("Não tem permissões para atualizar este pendente")
                }else{
                    res.jsonp(dados)
                }
            }else{
                res.status(404).send(`Erro. O pendente '${req.body._id}' não existe`)
            }
        })
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

    let email = null
    //se o nivel de utilizador é < 3.5 então só pode atualizar os seus pendentes
    if(req.user.level < 3.5){
        email = req.user.email
    }

    Pendentes.apagar(req.params.id, email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de um trabalho pendente '${req.params.id}': ${erro}`));
})

// Apaga todos trabalhos pendentes
router.delete('/', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    Pendentes.apagarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de todos os trabalhos pendentes: ${erro}`));
})

module.exports = router;
