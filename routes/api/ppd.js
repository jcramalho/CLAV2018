var express = require('express');
var router = express.Router();
var PPD = require('../../controllers/api/ppd');


//Retorna todos os PPD presentes na DB
router.get("/", function (req, res) {
    PPD.getAllPPD()
        .then((data) => res.jsonp(data))
        .catch((error) => res.status(500).send(`Error: ${error}`));
});

//Guardar PPD na DB
router.post("/registar", function (req, res) {
    PPD.inserirPPD(req.body)
        .then(dados => {
            if(dados) res.jsonp("PPD adicionado com sucesso")
            else res.status(500).jsonp("Erro na adição do PPD " + req.body.geral.nomePPD)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição do PPD "+req.body.geral.nomePPD+": " + erro))
});

router.get("/:nomePPD", function (req, res) {
    PPD.get(req.params.nomePPD)
        .then(dados => {

            if (!!dados) {
                res.status(200).jsonp({ valor: dados.valor });
            } else {
                res.status(404).send(`PPD ${req.params.nomePPD} não existe`)
            }
        })
        .catch(err => res.status(500).send(`PPD ${req.params.nomePPD} não existe: ${err}`));
});

module.exports = router;
