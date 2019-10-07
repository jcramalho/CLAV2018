var Auth = require('../../controllers/auth.js')
var Leg = require('../../controllers/api/leg.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Lista todos os documentos legislativos: id, data, numero, tipo, sumario, entidades
router.get('/', Auth.isLoggedInKey, (req, res) => {
	var queryData = url.parse(req.url, true).query
	// api/legislacao?estado=A
	if (queryData.estado && queryData.estado == 'A') {
		return Leg.listarAtivos()
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro na listagem dos diplomas ativos: ${erro}`))
	}
	// api/legislacao?processos=com
	if (queryData.processos && queryData.processos == 'com') {
		return Leg.listarComPNs()
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro na listagem dos diplomas com PNs associados: ${erro}`))
	}
	// api/legislacao?processos=sem
	if (queryData.processos && queryData.processos == 'sem') {
		return Leg.listarSemPNs()
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro na listagem dos diplomas sem PNs associados: ${erro}`))
	} else {
		return Leg.listar()
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro na listagem dos diplomas legislativos: ${erro}`))
	}
})

// Devolve a lista de legislações do tipo Portaria
router.get('/portarias', Auth.isLoggedInKey, (req, res) => {
	return Leg.portarias()
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta da leg de portarias: ${erro}`))
})

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', Auth.isLoggedInKey, (req, res) => {
	return Leg.consultar(req.params.id)
		.then((dados) => (dados ? res.jsonp(dados) : res.status(404).send(`Erro. A legislação '${req.params.id}' não existe`)))
		.catch((erro) => res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`))
})

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get('/:id/regula', Auth.isLoggedInKey, function(req, res) {
	return Leg.regula(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`))
})

// Verifica a existência do número de um diploma/legislacao: true == existe, false == não existe
router.post('/verificarNumero', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
	try {
		console.debug(req.body)
		res.jsonp(await Leg.existe(req.body))
	} catch (err) {
<<<<<<< HEAD
		res.status(500).send(`Erro na verificação do número do diploma: ${err}`)
=======
		res.status(500).send(`Erro na verificação da sigla: ${err}`)
>>>>>>> cb98da1778248e07afc78b89f071314de822b4f3
	}
})

module.exports = router
