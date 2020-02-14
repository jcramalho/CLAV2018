var Auth = require('../../controllers/auth.js')
var TermosIndice = require('../../controllers/api/termosIndice.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Devolve a lista dos termos de índice ou processa uma query
router.get('/', Auth.isLoggedInKey, function(req, res) {
	var queryData = url.parse(req.url, true).query
	if (queryData.existe) {
		return TermosIndice.existe(queryData.existe)
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro ao verificar se um TI existe: ${erro}`))
	} else {
		return TermosIndice.listar()
			.then((dados) => res.jsonp(dados))
			.catch((erro) => res.status(500).send(`Erro na listagem dos termos de índice: ${erro}`))
	}
})

// Devolve o número de termos na BD
router.get('/quantos', Auth.isLoggedInKey, function(req, res) {
	return TermosIndice.contar()
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na contagem dos termos de índice: ${erro}`))
})

module.exports = router
