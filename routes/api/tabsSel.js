var Auth = require('../../controllers/auth.js');
var SelTabs = require('../../controllers/api/tabsSel.js');

var formidable = require("formidable")
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    SelTabs.list()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes', function (req, res) {
    SelTabs.listClasses(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes/:parent/descendencia', function (req, res) {
    SelTabs.classChildren(req.params.parent,req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id', function (req, res) {
    SelTabs.stats(req.params.id)
        .then(result => res.send(result))
        .catch(function (error) {
            console.error(error);
        });
})

router.post('/CSV', async function (req, res){
    var form = new formidable.IncomingForm()

    form.parse(req, (error, fields, formData) => {
        if(!error){
            console.log(JSON.stringify(formData))
            res.send("OK")
        }else{
            res.status(500).json(`Erro ao importar CSV: ${erro}`)
        }
    })
    /*SelTabs.()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).jsonp(`Erro ao importar CSV: ${erro}`))
    */
})

module.exports = router;
