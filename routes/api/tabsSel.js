var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var SelTabs = require('../../controllers/api/tabsSel.js');
var Classes = require('../../controllers/api/classes.js');
var Trabalhos = require('../../controllers/api/trabalhos_guardados.js');

const Excel = require('exceljs/modern.nodejs');
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

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    //generate a new ID
    function genID(ids) {
        var newIDNum = 1;

        var list = ids
            .map(item => parseInt(
                item.id.value.replace(/[^#]+#ts_(.*)/, '$1')
            )).sort((a, b) => a - b)

        for (var i = 0; i < list.length; i++) {
            var idNum = list[i];

            if (newIDNum == idNum) {
                newIDNum++;
            }
            else {
                break;
            }
        }
        return "ts_" + newIDNum;
    }

    var dataObj = req.body;

    req.flash('warn_msg', 'Tabela de Seleção em processamento...');
    
    
    SelTabs.list()
        .then(function (list) {
            
            var id = genID(list);
            
            Classes.completeData(dataObj.classes)
                .then(function(classes){
                    
                    let relations = ["Rels1","Rels2","Rels3","Rels4","Rels5","Rels6","Rels7"];
                    var crits = [];
                    // filtrar relações por PNs que estejam na tabela
                    for(let clas of classes){
                        for(let rel of relations){
                            clas[rel].value = clas[rel].value
                                .split('%%')
                                .map(a => a.replace(/[^#]+#(.*)/, '$1'))
                                .filter(a=>dataObj.classes.indexOf(a)>-1)
                                .map( a => id+"_"+a)
                                .join('%%');
                        }
                        if(clas.Crits.value){
                            for(let c of clas.Crits.value.split('%%')){
                                crits.push(c.replace(/[^#]+#(.*)/, '$1'));
                            }
                        }
                    }
                    crits = crits.filter(a=>a!="");

                    Classes.criteriaMin(crits)
                        .then(function(criteriaData) {

                            SelTabs.createTab(id, dataObj.name, classes, criteriaData)
                                .then(function () {
                                    Logging.logger.info('Criada Tabela de Seleção \'' + id + '\' por utilizador \'' + req.user._id + '\'');

                                    req.flash('success_msg', 'PNs da nova TS já se encontram disponíveis para edição! (consultar área de trabalho)');

                                    let trab = {
                                        type: "TS: Alterar PNs",
                                        objID: id,
                                    } 

                                    Trabalhos.add(trab, req, res);
                                })
                                .catch(error => console.error(error)
                                );
                        })
                        .catch(error=>console.error(error));
                    
                    
                })
                .catch(error => console.error(error)
                );
        })
        .catch(error => console.error(error)
        );
})

router.post('/CSV', async function (req, res){
    var form = new formidable.IncomingForm()

    form.parse(req, (error, fields, formData) => {
        if(!error){
            var workbook = new Excel.Workbook();

            if(formData.file.type == "text/csv"){
                //TODO: fix
                workbook.csv.readFile(formData.file.path)
                    .then(worksheet => {
                        SelTabs.criarPedidoDoCSV(worksheet, fields.email)
                            .then(dados => res.json("Criado Pedido de criação de tabela de seleção a partir do ficheiro importado."))
                            .catch(erro => res.status(500).jsonp(`Erro ao importar CSV: ${erro}`))
                    })
                    .catch(erro => res.status(500).jsonp(`Erro ao importar CSV: ${erro}`))
            }else if(formData.file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
                workbook.xlsx.readFile(formData.file.path)
                    .then(function() {
                        SelTabs.criarPedidoDoCSV(workbook, fields.email)
                            .then(dados => res.json("Criado Pedido de criação de tabela de seleção a partir do ficheiro importado."))
                            .catch(erro => res.status(500).jsonp(`Erro ao importar Excel: ${erro}`))
                    })
                    .catch(erro => res.status(500).jsonp(`Erro ao importar Excel: ${erro}`))
            }else{
                res.status(415).json(`Erro ao importar CSV/Excel: o ficheiro tem de estar no formato csv ou excel (xlsx)`)
            }
        }else{
            res.status(500).json(`Erro ao importar CSV/Excel: ${erro}`)
        }
    })
})

module.exports = router;
