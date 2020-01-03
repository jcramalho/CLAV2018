var Auth = require('../../controllers/auth.js');
var SelTabs = require('../../controllers/api/tabsSel.js');
var Users = require('../../controllers/api/users.js');

const Excel = require('exceljs/modern.nodejs');
var formidable = require("formidable")
var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInKey, function (req, res) {
    SelTabs.list()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/skeleton', Auth.isLoggedInKey, function (req, res) {
    SelTabs.skeleton()
        .then( tsSkeleton => res.send(tsSkeleton))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes', Auth.isLoggedInKey, function (req, res) {
    SelTabs.listClasses(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes/:parent/descendencia', Auth.isLoggedInKey, function (req, res) {
    SelTabs.classChildren(req.params.parent, req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id', Auth.isLoggedInKey, function (req, res) {
    SelTabs.stats(req.params.id)
        .then(result => res.send(result))
        .catch(function (error) {
            console.error(error);
        });
})

router.post('/importar', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), async function (req, res){
    var form = new formidable.IncomingForm()
    
    Users.getUserById(req.user.id, function(err, user) {
        if(err){
            res.status(500).json(`Erro ao importar CSV/Excel, não foi possível obter o utilizador: ${err}`)
        }else{
            var entidade_user = req.user.entidade.split("_")[1]

            form.parse(req, async (error, fields, formData) => {
                if(!error){
                    if(formData.file && formData.file.type &&
                       formData.file.path && fields.tipo_ts &&
                       (fields.entidade_ts || fields.tipo_ts == 'TS Pluriorganizacional')){
                        var workbook = new Excel.Workbook();

                        if(!fields.entidade_ts){
                            fields.entidade_ts = null
                        }

                        if(formData.file.type == "text/csv"){
                            var possibleDelimiters = [",",";","\t","|"]
                            var i = 0
                            var len = possibleDelimiters.length
                            var parsed = false

                            var options = {
                                //Substitui função por forma a não realizar parse de datas, igual a usada pelo exceljs, caso vazio devolve null, no resto devolve string
                                map: (value, index) => {
                                    if (value === '') {
                                        return null;
                                    }

                                    return value;
                                }
                            }

                            while(!parsed){
                                try{
                                    //tenta as várias hipóteses de delimitadores do CSV
                                    options.delimiter = possibleDelimiters[i]
                                    var worksheet = await workbook.csv.readFile(formData.file.path, options)
                                    parsed = true
                                }catch(erro){
                                    if(++i == len){
                                        parsed = true
                                        res.status(500).json(`Erro ao importar CSV: Não foi possível fazer parsing do ficheiro.\nOs delimitadores podem ser: , ou ; ou \\t ou |.\nPara além disso o quote e o escape são realizados através de ".\nPor fim, o encoding do ficheiro tem de ser UTF-8.`)
                                    }
                                }
                            }

                            if(i < len){
                                SelTabs.criarPedidoDoCSV(workbook, user.email, entidade_user, fields.entidade_ts, fields.tipo_ts)
                                    .then(codigoPedido => res.json(codigoPedido))
                                    .catch(erro => res.status(500).json(`Erro ao importar CSV: ${erro}`))
                            }
                        }else if(formData.file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
                            workbook.xlsx.readFile(formData.file.path)
                                .then(function() {
                                    SelTabs.criarPedidoDoCSV(workbook, user.email, entidade_user, fields.entidade_ts, fields.tipo_ts)
                                        .then(dados => res.json(dados))
                                        .catch(erro => res.status(500).json(`Erro ao importar Excel: ${erro}`))
                                })
                                .catch(erro => res.status(500).json(`Erro ao importar Excel: ${erro}`))
                        }else{
                            res.status(415).json(`Erro ao importar CSV/Excel: o ficheiro tem de estar no formato CSV ou Excel (.xlsx)`)
                        }
                    }else{
                        res.status(500).json(`Erro ao importar CSV/Excel: O FormData deve possuir dois campos: um ficheiro em file e o tipo de TS em tipo_ts. Caso o tipo de TS seja 'TS Organizacional' deve possuir outro campo: a sigla da entidade da TS em entidade_ts.`)
                    }
                }else{
                    res.status(500).json(`Erro ao importar CSV/Excel: ${error}`)
                }
            })
        }
    })
})

module.exports = router;
