var Auth = require('../../controllers/auth.js')
var Indicadores = require('../../controllers/api/indicadores.js');
var express = require('express');
var router = express.Router();

router.get('/classesN4', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN4()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 4: ${err}`))
})

router.get('/classesN3', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN3()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 3: ${err}`))
})

router.get('/classesN2', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN2()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 2: ${err}`))
})

router.get('/classesN1', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN1()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 1: ${err}`))
})

router.get('/classes', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClasses()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes: ${err}`))
})

module.exports = router;
