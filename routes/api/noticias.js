var Auth = require('../../controllers/auth.js');
var Noticias = require('../../controllers/api/noticias.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Lista todas as noticias: data, titulo, desc
router.get('/', async (req, res, next) => {
    filtro = {}  
    var queryData = url.parse(req.url, true).query

    // api/noticias?recentes=sim
    if (queryData.recentes && queryData.recentes == 'sim') {
        try{
            res.locals.dados = await Noticias.recentes()

            if(req.query.info == "completa"){
                await Entidades.moreInfoList(res.locals.dados)
            }

            res.locals.tipo = "noticias"
            next()
		}catch(erro){
            res.status(500).send(`Erro na listagem das noticias recentes: ${erro}`)
        }
	} else {
        try{
            res.locals.dados = await Noticias.listar(filtro)
            if(req.query.info == "completa"){
                await Noticias.moreInfoList(res.locals.dados)
            }
    
            res.locals.tipo = "noticias"
            next()
        } catch(erro) {
            res.status(500).send(`Erro na listagem das noticias: ${erro}`)
        }
    }
})

// Consulta de uma noticia: titulo, data, desc
router.get('/:id', async (req, res, next) => {
    try{
        res.locals.dados = await Noticias.consultar(req.params.id)

        if(req.query.info == "completa"){
            await Noticias.moreInfo(res.locals.dados)
        }

        res.locals.tipo = "noticia"

		res.locals.dados ? next() : res.status(404).send(`Erro. A noticia '${req.params.id}' não existe`)
	} catch(erro) {
        res.status(500).send(`Erro na consulta da noticia '${req.params.id}': ${erro}`)
    }
})

// Update de uma Noticia
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var titulo = req.body.titulo
    var desc = req.body.desc
    var ativa = req.body.ativa
    var data = req.body.data
    if(typeof titulo !== "undefined" && typeof desc !== "undefined" && typeof ativa !== "undefined" && typeof data !== "undefined")
        Noticias.update(req.params.id,titulo,desc,data, ativa)
            .then(dados => {
                if(dados) res.jsonp("Noticia modificado com sucesso")
                else res.status(404).jsonp("Erro na modificação da Noticia "+req.params.id)
            })
            .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))    
    else res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": Titulo, descricao ou data nao definidos")
})

// Adiciona uma noticia
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var titulo = req.body.titulo
    var desc = req.body.desc
    var data = req.body.data
    if(typeof titulo !== "undefined" && typeof desc !== "undefined" && typeof data !== "undefined") {
        Noticias.criar({titulo,data, desc})
            .then(dados => {
                if(dados) res.jsonp("Noticia adicionada com sucesso")
                else res.status(404).jsonp("Erro na adição da Noticia " + req.body.titulo)
            })
            .catch(erro => res.status(404).jsonp("Erro na adição da Noticia "+req.body.titulo+": " + erro))
    } else res.status(404).jsonp("Erro na adição da Noticia: Campos em falta ")
})

module.exports = router;
