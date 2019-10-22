var Auth = require('../../controllers/auth.js')
var Entidades = require('../../controllers/api/entidades.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Lista todas as entidades: id, sigla, designacao, internacional
router.get('/', Auth.isLoggedInKey, async (req, res, next) => {
	var queryData = url.parse(req.url, true).query

    // api/entidades?processos=com
    if (queryData.processos && queryData.processos == 'com') {
        try{
		    res.locals.dados = await Entidades.listarComPNs()
            res.locals.tipo = "entidades"
            next()
		}catch(erro){
            res.status(500).send(`Erro na listagem das entidades com PNs associados: ${erro}`)
        }
	}
	// api/entidades?processos=sem
    else if (queryData.processos && queryData.processos == 'sem') {
        try{
            res.locals.dados = await Entidades.listarSemPNs()
            res.locals.tipo = "entidades"
            next()
		}catch(erro){
            res.status(500).send(`Erro na listagem das entidades sem PNs associados: ${erro}`)
        }
	} else {
        try{
		    res.locals.dados = await Entidades.listar(req.query)
            res.locals.tipo = "entidades"
            next()
		}catch(erro){
            res.status(500).send(`Erro na listagem das entidades: ${erro}`)
        }
	}
})

// Consulta de uma entidade: sigla, designacao, estado, internacional
router.get('/:id', Auth.isLoggedInKey, async (req, res, next) => {
    try{
        res.locals.dados = await Entidades.consultar(req.params.id)
        res.locals.tipo = "entidade"
        
        res.locals.dados ? next() : res.status(404).send(`Erro. A entidade '${req.params.id}' não existe`)
	} catch(erro) {
        res.status(500).send(`Erro na consulta da entidade '${req.params.id}': ${erro}`)
    }
})

// Lista as tipologias a que uma entidade pertence: id, sigla, designacao
router.get('/:id/tipologias', Auth.isLoggedInKey, (req, res) => {
	return Entidades.tipologias(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta das tipologias a que '${req.params.id}' pertence: ${erro}`))
})

// Lista os processos em que uma entidade intervem como dono
router.get('/:id/intervencao/dono', Auth.isLoggedInKey, (req, res) => {
	return Entidades.dono(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`))
})

// Lista os processos em que uma entidade intervem como participante
router.get('/:id/intervencao/participante', Auth.isLoggedInKey, (req, res) => {
	return Entidades.participante(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`))
})

// Verifica a existência da sigla de uma entidade: true == existe, false == não existe
router.post('/verificarSigla', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), async (req, res) => {
	try {
		res.jsonp(await Entidades.existeSigla(req.body.sigla))
	} catch (err) {
		res.status(500).send(`Erro na verificação da sigla: ${err}`)
	}
})

// Verifica a existência da designação de uma entidade: true == existe, false == não existe
router.post('/verificarDesignacao', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), async (req, res) => {
	try {
		res.jsonp(await Entidades.existeDesignacao(req.body.designacao))
	} catch (err) {
		res.status(500).send(`Erro na verificação da designação: ${err}`)
	}
})

module.exports = router
