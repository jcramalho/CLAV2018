var express = require('express');
var router = express.Router();
var PPDs = require('../../controllers/api/ppds');


//Retorna todos os PPDs presentes na DB
router.get("/", function (req, res) {
    PPDs.getAllPPDs()
        .then((data) => res.jsonp(data))
        .catch((error) => res.status(500).send(`Error: ${error}`));
});

//Guardar PPD na DB
router.post("/registar", function (req, res) {
    PPDs.inserirPPD(req.body)
        .then(dados => {
            if(dados) res.jsonp("PPD adicionado com sucesso")
            else res.status(500).jsonp("Erro na adição do PPD " + req.body.identificacao.nomeSI)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição do PPD "+req.body.identificacao.nomeSI+": " + erro))
});



module.exports = router;
