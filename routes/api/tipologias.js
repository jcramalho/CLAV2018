var Auth = require('../../controllers/auth.js')
var Tipologias = require('../../controllers/api/tipologias.js')

var express = require('express')
var router = express.Router()

// Lista todas as tipologias: id, sigla, designacao
router.get('/', Auth.isLoggedInKey, (req, res) => {
	const filtro = {
		estado: req.query.estado ? req.query.estado : 'Ativa',
		designacao: req.query.designacao
	}

	return Tipologias.listar(filtro)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na listagem das tipologias: ${erro}`))
})

// Consulta de uma tipologia: sigla, designacao, estado
router.get('/:id', Auth.isLoggedInKey, (req, res) => {
	return Tipologias.consultar(req.params.id)
		.then((dados) => (dados ? res.jsonp(dados) : res.status(404).send(`Erro. A tipologia '${req.params.id}' não existe`)))
		.catch((erro) => res.status(500).send(`Erro na consulta da tipologia '${req.params.id}': ${erro}`))
})

// Lista as entidades que pertencem à tipologia: sigla, designacao, id
router.get('/:id/elementos', Auth.isLoggedInKey, (req, res) => {
	return Tipologias.elementos(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consula dos elementos da tipologia '${req.params.id}': ${erro}`))
})

// Lista os processos em que uma tipologia intervem como dono
router.get('/:id/intervencao/dono', Auth.isLoggedInKey, (req, res) => {
	return Tipologias.dono(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`))
})

// Lista os processos em que uma tipologia intervem como participante
router.get('/:id/intervencao/participante', Auth.isLoggedInKey, (req, res) => {
	return Tipologias.participante(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`))
})

// Verifica a existência da sigla de uma tipologia: true == existe, false == não existe
router.post('/verificarSigla', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
	try {
		res.jsonp(await Tipologias.existeSigla(req.body.sigla))
	} catch (err) {
		res.status(500).send(`Erro na verificação da sigla: ${err}`)
	}
})

// Verifica a existência da designação de uma tipologia: true == existe, false == não existe
router.post('/verificarDesignacao', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
	try {
		res.jsonp(await Tipologias.existeDesignacao(req.body.designacao))
	} catch (err) {
		res.status(500).send(`Erro na verificação da designação: ${err}`)
	}
})

module.exports = router
