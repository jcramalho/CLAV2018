var Auth = require('../../controllers/auth.js');
var DocumentacaoApoio = require('../../controllers/api/documentacaoApoio.js')
var request = require('../../controllers/api/utils.js').request
var url = require('url')
var path = require('path')
var fs = require('fs')
var fsExtra = require('fs.extra')
var formidable = require("formidable")
var ncp = require('ncp').ncp;
ncp.limit = 16;

var express = require('express')
var router = express.Router()

// ------------------------------------------- GET -------------------------------------------

// Lista toda a documentacao de Apoio
router.get('/', Auth.isLoggedInKey, (req, res) => {
    var validKeys = ["classe"];
    var queryData = url.parse(req.url, true).query;
    
    var filtro = Object.entries(queryData)
        .filter(([k, v]) => v !== undefined && validKeys.includes(k))

    filtro = Object.assign({}, ...Array.from(filtro, ([k, v]) => ({[k]: v}) ));
    
    DocumentacaoApoio.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem da Documentação de Apoio: ${erro}`))
})

// Formulário para submissão de uma TS
router.get('/formulario', Auth.isLoggedInKey, (req, res) => {
    var path = "/classes?info=esqueleto&fs=text/csv";
    
    request.get(req, path)
      .then(function(dados){
        // Encoding 
        var data = dados.data;
        res.setHeader('Content-disposition', 'attachment; filename= formularioTS.csv');
        res.setHeader('Content-type', 'text/csv;charset=utf-8');
        res.write(data, function (err) {
            res.end()
        })
      })
      .catch(erro => res.status(500).send("Não foi possível o obter o formulário pré-preenchido para a submissão de uma TS. Tente novamente mais tarde!" + erro))
})


// Lista as classes existentes na Documentação
router.get('/classes', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.listar_classes()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das classes da Documentação de Apoio: ${erro}`))
})

// Retorna uma só classe e o seu conteúdo com base no id
router.get('/:id', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro: A classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})

// Retorna as entradas de uma classe com base no id
router.get('/:id/entradas/', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar_entradas(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro: A classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta das entradas da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})

// Retorna uma entrada de uma classe com base nos ids
router.get('/:id/entradas/:idEnt', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar_entrada(req.params.id, req.params.idEnt)
        .then(dados => dados && dados.length > 0 ? res.jsonp(dados[0]) : res.status(404).send(`Erro: A entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta da entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})

// Retorna os elementos textuais de uma entrada específica dentro de uma classe 
router.get('/:id/entradas/:idEnt/elementos', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar_elementos(req.params.id, req.params.idEnt)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro: A entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta dos elementos da entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})

// Retorna um elemento textual de uma entrada específica dentro de uma classe com base em ids 
router.get('/:id/entradas/:idEnt/elementos/:idElem', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar_elemento(req.params.id, req.params.idEnt, req.params.idElem)
        .then(dados => dados && dados.length > 0 ? res.jsonp(dados[0]) : res.status(404).send(`Erro: O elemento '${req.params.idElem}' associado à entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta do elemento '${req.params.idElem}' associado à entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})


// Retorna um ficheiro dentro de um elemento de uma entrada específica dentro de uma classe com base em ids 
router.get('/:id/entradas/:idEnt/elementos/:idElem/ficheiro', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoApoio.consultar_ficheiro(req.params.id, req.params.idEnt, req.params.idElem)
        .then(dados => dados && dados.length > 0 ? res.download(path.resolve(__dirname + '/../../' + dados[0].path)) : res.status(404).send(`Erro: O ficheiro do elemento '${req.params.idElem}' associado à entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio não existe.`))
	    .catch(erro => res.status(500).send(`Erro na consulta do ficheiro do elemento '${req.params.idElem}' associado à entrada '${req.params.idEnt}' da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})


// ------------------------------------------ POST ------------------------------------------- 

// Criar uma nova classe com entradas vazias, além de ser criada uma pasta para armazenar os ficheiros da classe
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var classe = req.body.classe;
    if(classe !== undefined) {
        var dbpath = '/public/documentacao_apoio/' + classe.replace(/ /g, '_'); 
        fs.mkdir(path.resolve(__dirname + '/../../' + dbpath),function(err){
            if (err) {
                res.status(500).jsonp("Ocorreu um erro na adição da classe à documentação de apoio.")
            } else {
                DocumentacaoApoio.criar_classe(classe)
                    .then(dados => {
                        if(dados) res.jsonp("Classe adicionada com sucesso à documentação de apoio.")
                        else res.status(404).jsonp("Erro na adição da classe à documentação de apoio.")
                    })
                    .catch(erro => res.status(404).jsonp("Erro na adição da classe à documentação de apoio: " + erro))
                    }
         });
    } else res.status(404).jsonp("Erro na adição da classe à documentação de apoio: campos em falta.")
})

// Criar entrada dentro de uma classe - apenas recebe a descrição, elementos são inicializados com lista vazia
router.post('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    // Descricao 
    var descricao = req.body.descricao;
    if(descricao !== undefined) {
        DocumentacaoApoio.criar_entrada(req.params.id, descricao)
            .then(dados => {
                if(dados) res.jsonp("Entrada adicionada com sucesso à classe " + req.params.id +" da documentação de apoio.")
                else res.status(404).jsonp("Erro na adição da entrada à classe " + req.params.id + " da documentação de apoio.")
            })
            .catch(erro => res.status(404).jsonp("Erro na adição da entrada à classe " + req.params.id + " da documentação de apoio: " + erro))
    } else res.status(404).jsonp("Erro na adição da entrada à classe " + req.params.id + " da documentação de apoio: campos em falta.")
})

// Criar elemento dentro de uma entrada numa classe 
router.post('/:id/entradas/:entrada', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, async (error, fields, formData) => {
        if(!error){
            // Verificar os dados textuais
            if(fields.texto && fields.visivel){
                    var documento = {
                        texto : fields.texto,
                        visivel : fields.visivel
                    };
                    // Verificar se existe um ficheiro no form
                    if(formData.file && formData.file.type && formData.file.path){
                        // Inserir ficheiro e gerar objeto para mongo
                        var oldPath = formData.file.path;
                        DocumentacaoApoio.consultar(req.params.id)
                            .then(function(dados){
                                let classe = dados.classe;
                                var dbpath = '/public/documentacao_apoio/' + classe.replace(/ /g, '_') + '/' + formData.file.name;
                                var newPath = path.resolve(__dirname + '/../../' + dbpath);
                                fsExtra.move(oldPath, newPath, function (err) {
                                    if (err) {
                                        res.status(500).json(`Erro na adição do elemento à documentação de apoio: ${err}`)
                                    }
                                    else {
                                        var novoFicheiro = { 
                                            data: formData.file.mtime,
                                            nome: formData.file.name,
                                            path: dbpath, 
                                            mimetype: formData.file.type, 
                                            size: formData.file.size
                                        };
                                        documento.ficheiro = novoFicheiro;
                                        DocumentacaoApoio.criar_elemento(req.params.id, req.params.entrada, documento)
                                            .then(dados => {
                                                if(dados) res.jsonp("Elemento adicionado com sucesso à documentação de apoio.")
                                                else res.status(404).jsonp("Erro na adição do elemento à documentação de apoio.")
                                            })
                                            .catch(erro => res.status(404).jsonp("Erro na adição do elemento à documentação de apoio: " + erro))
                                    }
                                })
                            })
                            .catch(erro => res.status(404).jsonp("Erro na adição do elemento à documentação de apoio: " + erro))
                    } else {
                        DocumentacaoApoio.criar_elemento(req.params.id, req.params.entrada, documento)
                            .then(dados => {
                                if(dados) res.jsonp("Elemento adicionado com sucesso à documentação de apoio.")
                                else res.status(404).jsonp("Erro na adição do elemento à documentação de apoio.")
                            })
                            .catch(erro => res.status(404).jsonp("Erro na adição do elemento à documentação de apoio: " + erro))
                    }
                }
            else {
                res.status(500).json(`Erro na adição do elemento à documentação de apoio: campos em falta.`)
            }
        }
        else {
            res.status(500).json(`Erro na adição do elemento à documentação: ${error}`)
        }
    })
})


// ------------------------------------------- PUT ------------------------------------------- 

// Alterar a designação da classe -> Mudar nome da pasta
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    // classe
    var classe = req.body.classe;
    if(classe !== undefined) {
        DocumentacaoApoio.consultar(req.params.id)
            .then(function(dados){
                var old = dados.classe;
                var oldPath = '/public/documentacao_apoio/' + old.replace(/ /g, '_')
                var dbpath = '/public/documentacao_apoio/' + classe.replace(/ /g, '_'); 
                fsExtra.move(path.resolve(__dirname + '/../../' + oldPath), path.resolve(__dirname + '/../../' + dbpath),function(err){
                    if (err) {
                        res.status(500).jsonp("Ocorreu um erro na atualização da classe " + req.params.id + ".")
                    } else {
                        // Atualizar a designação da classe
                        var novaClasse = dados;
                        novaClasse.classe = classe;
                        // ALterar os paths dos ficheiros existentes nos elementos da classe
                        novaClasse.entradas.forEach(entrada => {
                            entrada.elementos.forEach(elemento => {
                                if(elemento.ficheiro){
                                    elemento.ficheiro.path = elemento.ficheiro.path.replace(oldPath, dbpath);
                                }
                            })
                        })
                        // Editar a classe na BD
                        DocumentacaoApoio.editar_classe(req.params.id, novaClasse)
                            .then(dados => {
                                if(dados) res.jsonp("Classe da documentação de apoio atualizada com sucesso.")
                                else res.status(404).jsonp("Erro na atualização da classe " + req.params.id + " da documentação de apoio.")
                            })
                            .catch(erro => res.status(404).jsonp("Erro na atualização da classe " + req.params.id + " da documentação de apoio: " + erro))
                    }
                })
            })
            .catch(erro => res.status(500).jsonp("Ocorreu um erro na atualização da classe " + req.params.id + " da documentação de apoio."))
    } else res.status(404).jsonp("Erro na atualização da classe da documentação de apoio: campos em falta.")
})

// Alterar entrada numa classe
router.put('/:id/entradas/:entrada', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    // Descricao 
    var descricao = req.body.descricao;
    if(descricao !== undefined) {
        DocumentacaoApoio.editar_entrada(req.params.id, req.params.entrada, descricao)
            .then(dados => {
                if(dados) res.jsonp("Entrada atualizada com sucesso na classe " + req.params.id + " da documentação de apoio.")
                else res.status(404).jsonp("Erro na atualização da entrada na classe " + req.params.id + " da documentação de apoio.")
            })
            .catch(erro => res.status(404).jsonp("Erro na atualização da entrada na classe " + req.params.id + " da documentação de apoio: " + erro))
    } else res.status(404).jsonp("Erro na atualização da entrada na classe " + req.params.id + " da documentação de apoio: campos em falta.")
})

// Altera um elemento dentro de uma entrada
router.put('/:id/entradas/:entrada/elementos/:elemento', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, async (error, fields, formData) => {
        if(!error){
            // Verificar os dados textuais
            if(fields.texto && fields.visivel){
                DocumentacaoApoio.consultar_elemento(req.params.id, req.params.entrada, req.params.elemento)
                    .then(function(dados){
                        if(dados && dados.length > 0){
                            var documento = dados[0];
                            documento.texto = fields.texto;
                            documento.visivel = fields.visivel;
                            // Verificar se existe um ficheiro no form
                            if(formData.file && formData.file.type && formData.file.path){
                                // Se já existir ficheiro, tem que ser apagado 
                                if(dados[0].ficheiro){
                                    fs.unlink(path.resolve(__dirname + '/../../' + dados[0].ficheiro.path), function (err) {
                                        if (err){
                                            res.status(500).json(`Erro na atualização do elemento da documentação de apoio: ${err}`)
                                        }
                                    });
                                }
                                // Inserir ficheiro e gerar objeto para mongo
                                var oldPath = formData.file.path;
                                DocumentacaoApoio.consultar(req.params.id)
                                    .then(function(dados){
                                        let classe = dados.classe;
                                        var dbpath = '/public/documentacao_apoio/' + classe.replace(/ /g, '_') + '/' + formData.file.name;
                                        var newPath = path.resolve(__dirname + '/../../' + dbpath);
                                        fsExtra.move(oldPath, newPath, function (err) {
                                            if (err) {
                                                res.status(500).json(`Erro na atualização do elemento da documentação de apoio: ${err}`)
                                            }
                                            else {
                                                var novoFicheiro = { 
                                                    data: formData.file.mtime,
                                                    nome: formData.file.name,
                                                    path: dbpath, 
                                                    mimetype: formData.file.type, 
                                                    size: formData.file.size
                                                };
                                                documento.ficheiro = novoFicheiro;
                                                DocumentacaoApoio.editar_elemento(req.params.id, req.params.entrada, req.params.elemento, documento)
                                                    .then(dados => {
                                                        if(dados) res.jsonp("Elemento da documentação de apoio atualizado com sucesso.")
                                                        else res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio.")
                                                    })
                                                    .catch(erro => res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio: " + erro))
                                            }
                                        })
                                    })
                                    .catch(erro => res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio: " + erro))
                            } else if(fields.apagar_ficheiro && documento.ficheiro){
                                // Caso a flag de apagar ficheiro sem substituição seja enviada no form
                                fs.unlink(path.resolve(__dirname + '/../../' + dados[0].ficheiro.path), function (err) {
                                    if (err){
                                        res.status(500).json(`Erro na atualização do elemento da documentação de apoio: ${err}`)
                                    } else {
                                        // Apagar o objeto do documento
                                        delete documento.ficheiro;
                                        // Atualizar a BD
                                        DocumentacaoApoio.editar_elemento(req.params.id, req.params.entrada, req.params.elemento, documento)
                                            .then(dados => {
                                                if(dados) res.jsonp("Elemento da documentação de apoio atualizado com sucesso.")
                                                else res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio.")
                                            })
                                            .catch(erro => res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio: " + erro))
                                    }
                                });
                            } 
                            else {
                                DocumentacaoApoio.editar_elemento(req.params.id, req.params.entrada, req.params.elemento, documento)
                                    .then(dados => {
                                        if(dados) res.jsonp("Elemento da documentação de apoio atualizado com sucesso.")
                                        else res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio.")
                                    })
                                    .catch(erro => res.status(404).jsonp("Erro na atualização do elemento da documentação de apoio: " + erro))
                            }
                        } else {
                            res.status(404).send(`Erro: O elemento a atualizar na classe '${req.params.id}' não existe.`)
                        }
                    })
                    .catch(erro => res.status(500).send(`Erro na atualização do elemento da classe '${req.params.id}': ${erro}`))
                }
            else {
                res.status(500).json(`Erro na atualização do elemento da documentação de apoio: campos em falta.`)
            }
        }
        else {
            res.status(500).json(`Erro na atualização do elemento da documentação de apoio: ${error}`)
        }
    })
    
})

// ------------------------------------------- DELETE -------------------------------------------

// Apaga uma classe -> eliminar a pasta
router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    DocumentacaoApoio.consultar(req.params.id)
        .then(function(dados) { 
            if(dados){
                let classe = dados.classe;
                var dbpath = '/public/documentacao_apoio/' + classe.replace(/ /g, '_');
                // Apagar a diretoria da classe
                fsExtra.remove(path.resolve(__dirname + '/../../' + dbpath), function(err){
                        if(err){
                            res.status(500).jsonp("Ocorreu um erro na eliminação da classe " + req.params.id +" da documentação de apoio.")
                        } else {
                            // Eliminar 
                            DocumentacaoApoio.eliminar(req.params.id, function(err, user){
                                if(err){
                                    res.status(500).send("Não foi possível eliminar a classe da documentação de apoio.");
                                }else{
                                    res.send('Documentação eliminada com sucesso.');
                                }
                            })
                        }
                    }
                );
            }
            else {
                res.status(404).send(`Erro: a classe '${req.params.id}' da documentação de apoio não existe`)
            }
        })
        .catch(erro => res.status(500).send(`Erro na eliminação da classe '${req.params.id}' da documentação de apoio: ${erro}`))
})

// Apaga uma entrada -> eliminar ficheiros nos elementos
router.delete('/:id/entradas/:entrada', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    // entrada
    // GET entrada
    DocumentacaoApoio.consultar_entrada(req.params.id, req.params.entrada)
        .then(function(dados) { 
            if(dados && dados.length > 0){
                // Apagar da BD
                DocumentacaoApoio.eliminar_entrada(req.params.id, req.params.entrada, function(err, user){
                    if(err){
                        res.status(500).send("Não foi possível eliminar a entrada da documentação de apoio.");
                    }else{
                        for(let i = 0; i < dados[0].elementos.length; i++){
                            // Caso existissem ficheiros associados à entrada, estes devem ser apagados
                            if(dados[0].elementos[i].ficheiro){
                                fs.unlink(path.resolve(__dirname + '/../../' + dados[0].elementos[i].ficheiro.path), function (err) {
                                    if (err){
                                        res.status(500).send(`Erro na eliminação da entrada da documentação de apoio: ${err}`)
                                    } 
                                });
                            }
                        }        
                        res.send('Entrada da documentação de apoio eliminada com sucesso.');
                    }
                })
            }
            else {
                res.status(404).send(`Erro: A entrada '${req.params.entrada}' da classe '${req.params.id}' da documentação de apoio não existe.`)
            }
        })
        .catch(erro => res.status(500).send(`Erro na eliminação da entrada da documentação de apoio: ${erro}`))
})

// Apaga um elemento -> eliminar ficheiro se existir
router.delete('/:id/entradas/:entrada/elementos/:elemento', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    // elemento
    // GET elemento 
    DocumentacaoApoio.consultar_elemento(req.params.id, req.params.entrada, req.params.elemento)
        .then(function(dados) { 
            if(dados && dados.length > 0){
                // Caso possua um ficheiro associado este deve ser apagado
                if(dados[0].ficheiro){
                    fs.unlink(path.resolve(__dirname + '/../../' + dados[0].ficheiro.path), function (err) {
                        if (err){
                            res.status(500).send(`Erro na eliminação do elemento da documentação de apoio: ${err}`)
                        } else {
                            // Apagar da Base de Dados
                            DocumentacaoApoio.eliminar_elemento(req.params.id, req.params.entrada, req.params.elemento, function(err, user){
                                if(err){
                                    res.status(500).send("Não foi possível eliminar o elemento da documentação de apoio.");
                                }else{
                                    res.send('Elemento da documentação de apoio eliminado com sucesso.');
                                }
                            })
                        }
                    });
                } else {
                    // Apagar da Base de Dados
                    DocumentacaoApoio.eliminar_elemento(req.params.id, req.params.entrada, req.params.elemento, function(err, user){
                        if(err){
                            res.status(500).send("Não foi possível eliminar o elemento da documentação de apoio.");
                        }else{
                            res.send('Elemento da documentação de apoio eliminado com sucesso.');
                        }
                    })
                }
            }
            else {
                res.status(404).send(`Erro: O elemento '${req.params.elemento}' associado à entrada '${req.params.entrada}' da classe '${req.params.id}' da documentação de apoio não existe`)
            }
        })
        .catch(erro => res.status(500).send(`Erro na eliminação do elemento da documentação de apoio: ${erro}`))
})

module.exports = router;