var Auth = require('../../controllers/auth.js')
var Leg = require('../../controllers/api/leg.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Lista todos os documentos legislativos: id, data, numero, tipo, sumario, entidades
router.get('/', Auth.isLoggedInKey, async (req, res, next) => {
	var queryData = url.parse(req.url, true).query
	// api/legislacao?estado=A
	if (queryData.estado && queryData.estado == 'A') {
        try{
		    res.locals.dados = await Leg.listarAtivos()

            if(req.query.info == "completa"){
                await Leg.moreInfoList(res.locals.dados)
            }

            res.locals.tipo = "legislacoes"
            next()
		} catch(erro) {
            res.status(500).send(`Erro na listagem dos diplomas ativos: ${erro}`)
        }
	}
	// api/legislacao?processos=com
	if (queryData.processos && queryData.processos == 'com') {
        try{
            res.locals.dados = await Leg.listarComPNs()

            if(req.query.info == "completa"){
                await Leg.moreInfoList(res.locals.dados)
            }

            res.locals.tipo = "legislacoes"
            next()
		} catch (erro) {
            res.status(500).send(`Erro na listagem dos diplomas com PNs associados: ${erro}`)
        }
	}
	// api/legislacao?processos=sem
	if (queryData.processos && queryData.processos == 'sem') {
        try{
		    res.locals.dados = await Leg.listarSemPNs()

            if(req.query.info == "completa"){
                await Leg.moreInfoList(res.locals.dados)
            }

            res.locals.tipo = "legislacoes"
            next()
		} catch (erro) {
            res.status(500).send(`Erro na listagem dos diplomas sem PNs associados: ${erro}`)
        }
	}
	// api/legislacao?fonte=XXXX
	if (queryData.fonte) {
		try {
			res.locals.dados = await Leg.listarFonte(queryData.fonte)

            if(req.query.info == "completa"){
                await Leg.moreInfoList(res.locals.dados)
            }

			res.locals.tipo = "legislacoes"
			next()
		} catch (erro) {
			res.status(500).send(`Erro na listagem de legislações com fonte ${queryData.fonte}: ${erro}`)
		}
	} else {
        try{
            res.locals.dados = await Leg.listar()

            if(req.query.info == "completa"){
                await Leg.moreInfoList(res.locals.dados)
            }

            res.locals.tipo = "legislacoes"
            next()
		} catch (erro) {
            res.status(500).send(`Erro na listagem dos diplomas legislativos: ${erro}`)
        }
	}
})

// Devolve a lista de legislações do tipo Portaria
router.get('/portarias', Auth.isLoggedInKey, (req, res) => {
	return Leg.portarias()
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta da leg de portarias: ${erro}`))
})

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get('/:id', Auth.isLoggedInKey, async (req, res, next) => {
    try{
        res.locals.dados = await Leg.consultar(req.params.id)

        if(req.query.info == "completa"){
            res.locals.dados.id = req.params.id
            await Leg.moreInfo(res.locals.dados)
        }

        res.locals.tipo = "legislacao"
        res.locals.dados ? next() : res.status(404).send(`Erro. A legislação '${req.params.id}' não existe`)
	} catch (erro) {
        res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`)
    }
})

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get('/:id/regula', Auth.isLoggedInKey, function(req, res) {
	return Leg.regula(req.params.id)
		.then((dados) => res.jsonp(dados))
		.catch((erro) => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`))
})

// Verifica a existência do número de um diploma/legislacao: true == existe, false == não existe
router.post('/verificarNumero', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), async (req, res) => {
	try {
		res.jsonp(await Leg.existe(req.body))
	} catch (err) {
		res.status(500).send(`Erro na verificação do número do diploma: ${err}`)
	}
})

module.exports = router
