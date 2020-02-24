var Auth = require('../../controllers/auth.js')
var Tipologias = require('../../controllers/api/tipologias.js')

var express = require('express')
var router = express.Router()

// Lista todas as tipologias: id, sigla, designacao
router.get('/', Auth.isLoggedInKey, async (req, res, next) => {
    var filtro = [
        `?estado = "${req.query.estado ? req.query.estado : "Ativa"}"`,
        req.query.designacao ? `?designacao = "${req.query.designacao}"` : undefined,
        req.query.tips ? `?uri IN (${req.query.tips.split(",").map(t => `clav:${t}`).join(",")})` : undefined
    ].filter(v => v !== undefined).join(" && ")

    try{
        res.locals.dados = await Tipologias.listar(filtro)

        if(req.query.info == "completa"){
            await Tipologias.moreInfoList(res.locals.dados)
        }

        res.locals.tipo = "tipologias"
        next()
    } catch(erro) {
        res.status(500).send(`Erro na listagem das tipologias: ${erro}`)
    }
})

// Verifica se a sigla já existe numa entidade
router.get('/sigla', Auth.isLoggedInKey, (req, res) => {
    Tipologias.existeSigla(req.query.valor)
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro na verificação da sigla: ${err}`))
})

// Verifica se a designação já existe numa entidade
router.get('/designacao', Auth.isLoggedInKey, (req, res) => {
    Tipologias.existeDesignacao(req.query.valor)
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro na verificação da designação: ${err}`))
})

// Consulta de uma tipologia: sigla, designacao, estado
router.get('/:id', Auth.isLoggedInKey, async (req, res, next) => {
    try{
        res.locals.dados = await Tipologias.consultar(req.params.id)

        if(req.query.info == "completa"){
            await Tipologias.moreInfo(res.locals.dados)
        }

        res.locals.tipo = "tipologia"

		res.locals.dados ? next() : res.status(404).send(`Erro. A tipologia '${req.params.id}' não existe`)
	} catch(erro) {
        res.status(500).send(`Erro na consulta da tipologia '${req.params.id}': ${erro}`)
    }
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

module.exports = router
