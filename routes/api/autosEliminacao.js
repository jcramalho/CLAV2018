var Auth = require("../../controllers/auth.js");
var AutosEliminacao = require("../../controllers/api/autosEliminacao.js");
var Classes = require("../../controllers/api/classes.js");
var User = require("../../controllers/api/users.js");
var xml = require("libxmljs");
var xml2js = require("xml2js");
var fs = require("fs");
var Papa = require('papaparse')
var errosAE = require("../../errors/errosAE.json")

const PGD = require("../../controllers/api/pgd.js")

var State = require('../../controllers/state')
const stripenanoid = require('stripe-nanoid'); 
const options = {
    alphabet: 'abcefghijklmnopqrstuvwxyz0123456789',
    size: 9
  };

const Ajv = require("ajv")
const ajv = new Ajv() 

const { validationResult } = require("express-validator");
const {
  existe,
  estaEm,
  verificaAEId,
  vcTipoAE,
  vcFonte,
} = require("../validation");

var express = require("express");
var router = express.Router();
var formidable = require("formidable");

router.get("/", Auth.isLoggedInKey, (req, res) => {
  AutosEliminacao.listar()
    .then((dados) => res.jsonp(dados))
    .catch((erro) => res.status(404).jsonp("Erro na listagem dos AE: " + erro));
});

router.get("/:id", Auth.isLoggedInKey, [verificaAEId("param", "id")], 
  function (req,res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.array());
  }

  AutosEliminacao.consultar(req.params.id, req.user ? req.user.entidade : null)
    .then((dados) => res.jsonp(dados))
    .catch((erro) =>
      res
        .status(404)
        .jsonp("Erro na consulta do AE " + req.params.id + ": " + erro)
    );
});

//Criar um AE && Importar AE
router.post("/", Auth.isLoggedInUser, Auth.checkLevel([5, 6, 7]),
  [existe("body", "auto")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    AutosEliminacao.adicionar(req.body.auto)
      .then((dados) => res.status(201).jsonp(dados))
      .catch((err) =>
        res.status(500).send(`Erro na criação de auto de eliminação: ${err}`)
      );
  }
);

/*-----------------------------------------------------------------------
---------------------- IMPORTAÇÃO EM 1 FICHEIRO JSON --------------------*/

validaEstruturaJSON = function(req, res, next){
  var form = new formidable.IncomingForm();
  form.parse(req, async (error, fields, formData) => {
    if (error)
      res.status(512).jsonp({mensagem: `${errosAE.csv1_512} ${error}`, erros: []});
    else if (!formData.file || !formData.file.path)
      res.status(513).jsonp({mensagem: `${errosAE.csv2_513}`, erros: []});
    else if (formData.file.type == "application/json") {
      
      try { 
        var docJSON = fs.readFileSync(formData.file.path);
        var doc = JSON.parse(docJSON)
        req.doc = doc
        next()
      }
      catch(e) { res.status(514).jsonp({ mensagem: errosAE.json24_514, erros: []}); }

    } else 
        res.status(516).jsonp({
          mensagem: errosAE.json26_516,
          erros: []
        })
  }) 
}

convFormatoIntermedioJSON = function(req, res, next){
  var mensagens = [] // Mensagens de erro
  var myAuto = req.doc

  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)

  // legislacao
  var myLeg = ''
  try { 
    myLeg = State.getLegislacaoByCodigo(myAuto.legislacao.slice(4))
    myAuto.legislacao = myAuto.tipo + " " + myLeg.codigo
    myAuto.refLegislacao = myLeg.id
  } catch(e) { mensagens.push(errosAE.csv27) }

  // tipo  
  myAuto.tipo = 'AE_' + myAuto.tipo

  // entidades
  var myEntidades = myAuto.entidades.map(f => { 
      let ent = State.getEntidade('ent_' + f)
      return ent
  })
  myAuto.entidades = myEntidades.map(e => {return {
      entidade: e.id,
      designacao: e.designacao
  }})

  // classes
  for(var i=0; i < myAuto.classes.length; i++){
    if(!myAuto.classes[i].hasOwnProperty('agregacoes'))
      myAuto.classes[i].agregacoes = []
    if(myAuto.classes[i].hasOwnProperty('dataInicial'))
      myAuto.classes[i].dataInicial = myAuto.classes[i].dataInicial.toString()
    if(myAuto.classes[i].hasOwnProperty('dataFinal'))
      myAuto.classes[i].dataFinal = myAuto.classes[i].dataFinal.toString()
    if(myAuto.classes[i].hasOwnProperty('medicaoPapel'))
      myAuto.classes[i].medicaoPapel = myAuto.classes[i].medicaoPapel.toString()
    if(myAuto.classes[i].hasOwnProperty('medicaoDigital'))
      myAuto.classes[i].medicaoDigital = myAuto.classes[i].medicaoDigital.toString()
    if(myAuto.classes[i].hasOwnProperty('medicaoOutro'))
      myAuto.classes[i].medicaoOutro = myAuto.classes[i].medicaoOutro.toString()

    var newDono = ''
    if(myAuto.classes[i].hasOwnProperty('dono')) {
      for(var d=0; d < myAuto.classes[i].dono.length; d++) 
        newDono = newDono + myAuto.classes[i].dono[d] + "#"
      myAuto.classes[i].dono = newDono
    }  


    if(myAuto.classes[i].hasOwnProperty('agregacoes')) 
      for(var x=0; x < myAuto.classes[i].agregacoes.length; x++){
        myAuto.classes[i].agregacoes[x].valor = true
        if(myAuto.classes[i].agregacoes[x].hasOwnProperty('intervencao')){
          myAuto.classes[i].agregacoes[x].ni = myAuto.classes[i].agregacoes[x].intervencao
          delete myAuto.classes[i].agregacoes[x].intervencao
        }
        if(myAuto.classes[i].agregacoes[x].hasOwnProperty('dataInicioContagemPCA')){
          myAuto.classes[i].agregacoes[x].dataContagem = myAuto.classes[i].agregacoes[x].dataInicioContagemPCA.toString()
          delete myAuto.classes[i].agregacoes[x].dataInicioContagemPCA
        }
      }
    myAuto.classes[i].id = myAuto.id + "_classe_" + i
  }

  if (mensagens.length > 0)
    return res.status(517).jsonp({
      mensagem: errosAE.csv29_517,
      erros: mensagens
    });
  else {
    req.doc = myAuto
    req.import = "json"
    next()
  }
}

/*----------------------------------------------------------------------
---------------------- IMPORTAÇÃO EM 1 FICHEIRO XML --------------------*/

validaEstruturaXML = function(req, res, next){
  var form = new formidable.IncomingForm();
  form.parse(req, async (error, fields, formData) => {
    if (error)
      res.status(512).jsonp({mensagem: `${errosAE.csv1_512} ${error}`, erros: []});
    else if (!formData.file || !formData.file.path)
      res.status(513).jsonp({mensagem: `${errosAE.csv2_513}`, erros: []});
    else if (formData.file.type == "text/xml") {

      var schemaPath = __dirname + "/../../public/schema/autoEliminacao.xsd";
      var schema = fs.readFileSync(schemaPath);
      var xsd = xml.parseXml(schema);
      var doc = fs.readFileSync(formData.file.path);
      var xmlDoc = xml.parseXml(doc);

      if (xmlDoc.validate(xsd)) {
        const parser = new xml2js.Parser();
        parser.parseString(doc, (error, result) => {
          if (error) {
            res.status(514).jsonp({
              mensagem: errosAE.xml24_514,
              erros: error
            })
          } else {
            req.doc = result.autoEliminacao
            next()
          }
        });
      } else {
        var mensagens = []
        for(var i=0; i < xmlDoc.validationErrors.length; i++) {
          mensagens.push(errosAE.xml23 + xmlDoc.validationErrors[i].line)
        }
        res.status(514).jsonp({
          mensagem: errosAE.xml24_514,
          erros: mensagens
        })
      } 
    } else
        res.status(516).jsonp({
          mensagem: errosAE.xml26_516,
          erros: []
        })
  });
}

convFormatoIntermedioXML = function(req, res, next){
  var mensagens = [] // Mensagens de erro
  var myAuto = req.doc

  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)

  // legislacao
  var myLeg = ''
  try { 
    myLeg = State.getLegislacaoByCodigo(myAuto.legislacao[0].slice(4))
    myAuto.legislacao = myAuto.tipo[0] + " " + myLeg.codigo
    myAuto.refLegislacao = myLeg.id
  } catch(e) { mensagens.push(errosAE.csv27) }

  // tipo
  myAuto.tipo = 'AE_' + myAuto.tipo[0]
  
  // entidades
  var myEntidades = myAuto.entidades[0].entidade.map(f => { 
    let ent = State.getEntidade('ent_' + f)
    return ent
  })
  myAuto.entidades = myEntidades.map(e => {return {
      entidade: e.id,
      designacao: e.designacao
  }})

  var todasClasses = myAuto.classes[0].classe
  myAuto.classes = []
  // classes
  for(var i=0; i < todasClasses.length; i++){
    var c = {}

    if(todasClasses[i].hasOwnProperty('codigo'))
      c.codigo = todasClasses[i].codigo[0]
    if(todasClasses[i].hasOwnProperty('referencia'))
      c.referencia = todasClasses[i].referencia[0]

    if(todasClasses[i].hasOwnProperty('donos')) {
      c.donos = todasClasses[i].donos[0].dono
      var newDono = ''
      for(var d=0; d < c.donos.length; d++) 
        newDono = newDono + c.donos[d] + "#"
      c.donos = newDono
    }
   
    c.dataInicial = todasClasses[i].dataInicial[0].toString()
    c.dataFinal = todasClasses[i].dataFinal[0].toString()
  
    if(todasClasses[i].hasOwnProperty('medicaoPapel'))
      c.medicaoPapel = todasClasses[i].medicaoPapel[0].toString()
    if(todasClasses[i].hasOwnProperty('medicaoDigital'))
      c.medicaoDigital = todasClasses[i].medicaoDigital[0].toString()
    if(todasClasses[i].hasOwnProperty('medicaoOutro'))
      c.medicaoOutro = todasClasses[i].medicaoOutro[0].toString()

    c.numAgregacoes = todasClasses[i].numAgregacoes[0]

    if(!todasClasses[i].hasOwnProperty('agregacoes'))
      c.agregacoes = []
    else {
      var todasAgregs = todasClasses[i].agregacoes[0]
      var agregs = []
      for(var x=0; x < todasAgregs.length; x++){
        var a = {}
        
        a.codigoAgregacao = todasAgregs[x].codigoAgregacao[0]
        a.titulo = todasAgregs[x].titulo[0]

        if(myAuto.classes[i].agregacoes[x].hasOwnProperty('intervencao'))
          a.ni = todasAgregs[x].intervencao[0]
          
        if(myAuto.classes[i].agregacoes[x].hasOwnProperty('dataInicioContagemPCA'))
          a.dataContagem = todasAgregs[x].dataInicioContagemPCA[0].toString()
        
        a.valor = true

        agregs.push(a)
      }
      c.agregacoes = agregs
    }
      c.id = myAuto.id + "_classe_" + i
    myAuto.classes.push(c)
  }
  delete myAuto["$"]

  if (mensagens.length > 0)
    return res.status(517).jsonp({
      mensagem: errosAE.csv29_517,
      erros: mensagens
    });
  else {
    req.doc = myAuto
    req.import = "xml"
    next()
  }
}

/*------------------------------------------------------------------------
------------------ IMPORTAÇÃO EM 1 OU 2 FICHEIROS CSV --------------------*/

validaEstruturaCSV = async function(req, res, next){
  var form = new formidable.IncomingForm()

  form.parse(req, async (error, fields, formData) => {

    if (error)
      res.status(512).jsonp({mensagem: `${errosAE.csv1_512} ${error}`, erros: []});
    else if (!formData.file || !formData.file.path)
      res.status(513).jsonp({mensagem: `${errosAE.csv2_513}`, erros: []});
    else if (formData.file.type == "text/csv" || formData.file.type == "application/vnd.ms-excel") {
      var file = fs.readFileSync(formData.file.path, 'utf8')
      Papa.parse(file, {
        skipEmptyLines: "greedy",
        header: true,
        transformHeader:function(h) {
          return h.trim();
        },
        complete: async function(results) {
          var tipo = fields.tipo
          var f1 = results.data
          var linha = results.data[0]
          var mensagens = []

          if(f1.length != 0){
            if((Object.keys(linha).length) != 9)
              mensagens.push(errosAE.csv3);
            if(!linha.hasOwnProperty('codigo')){
              if(tipo == "TS_LC" || tipo == "PGD_LC")
                mensagens.push(errosAE.csv4);
              else
                mensagens.push(errosAE.csv5);
            }
            if(!linha.hasOwnProperty('referencia')) mensagens.push(errosAE.csv6);
            if(!linha.hasOwnProperty('dataInicial')) mensagens.push(errosAE.csv7);
            if(!linha.hasOwnProperty('dataFinal')) mensagens.push(errosAE.csv8);
            if(!linha.hasOwnProperty('numAgregacoes')) mensagens.push(errosAE.csv9);
            if(!linha.hasOwnProperty('medicaoPapel')) mensagens.push(errosAE.csv10);
            if(!linha.hasOwnProperty('medicaoDigital')) mensagens.push(errosAE.csv11);
            if(!linha.hasOwnProperty('medicaoOutro')) mensagens.push(errosAE.csv12);
            if(!linha.hasOwnProperty('dono')) mensagens.push(errosAE.csv13);
          }
          else
            mensagens.push(errosAE.csv14);

          if(formData.agreg) { // AMBOS FICHEIROS
            if(formData.agreg.type == "application/vnd.ms-excel" || formData.file.type == "text/csv"){
              var file2 = fs.readFileSync(formData.agreg.path, 'utf8')
              Papa.parse(file2, {
                  skipEmptyLines: "greedy",
                  header: true,
                  transformHeader:function(h) {
                    return h.trim();
                  },
                  complete: async function(results) {
                    var f2 = results.data
                    var linha = results.data[0]
                    var mensagens2 = []

                    if(f2.length != 0){
                      if((Object.keys(linha).length) != 6)
                        mensagens2.push(errosAE.csv15);
                      if(!linha.hasOwnProperty('codigoClasse')){
                        if(tipo == "TS_LC" || tipo == "PGD_LC")
                          mensagens2.push(errosAE.csv16);
                        else
                          mensagens2.push(errosAE.csv17);
                      }
                      if(!linha.hasOwnProperty('referencia')) mensagens2.push(errosAE.csv18);
                      if(!linha.hasOwnProperty('codigoAgregacao')) mensagens2.push(errosAE.csv19);
                      if(!linha.hasOwnProperty('titulo')) mensagens2.push(errosAE.csv20);
                      if(!linha.hasOwnProperty('dataInicioContagemPCA')) mensagens2.push(errosAE.csv21);
                      if(!linha.hasOwnProperty('intervencao')) mensagens2.push(errosAE.csv22);
                    }
                    else
                      mensagens2.push(errosAE.csv23);

                    if (mensagens.length > 0 || mensagens2.length > 0) {
                      let mens = []
                      for(var i=0; i < mensagens.length; i++)
                        mens.push(mensagens[i])
                      for(var j=0; j < mensagens2.length; j++)
                        mens.push(mensagens2[j])
                      return res.status(514).jsonp({
                        mensagem: errosAE.csv24_514,
                        erros: mens
                      })
                    } else {
                      req.doc = []
                      req.doc.push(fields)
                      req.doc.push(f1)
                      req.doc.push(results.data)
                      next()
                    }
                  }
              });
            } 
            else
              res.status(515).jsonp({
                mensagem: errosAE.csv25_515,
                erros: mensagens
              })
          } else { // SÓ FICHEIRO DAS CLASSES
            if (mensagens.length > 0)
              return res.status(514).jsonp({
                mensagem: errosAE.csv24_514,
                erros: mensagens
              })
            else {
              req.doc = []
              req.doc.push(fields)
              req.doc.push(f1)
              next()
            }
          }
        }
      })
    } else 
        res.status(516).jsonp({
          mensagem: errosAE.csv26_516,
          erros: mensagens
        })
  })
}

convFormatoIntermedioCSV = function(req, res, next){
  var mensagens = [] // Mensagens de erro
  var classes = req.doc[1]
  var agregs = req.doc[2]
  var myAuto = {}
  var subAgreg = true

  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)

  // tipo
  myAuto.tipo = 'AE_' + req.doc[0].tipo
  
  // legislacao
  var myLeg = ''
  try { 
    myLeg = State.getLegislacaoByCodigo(req.doc[0].legitimacao.slice(4))
    myAuto.legislacao = req.doc[0].tipo + " " + myLeg.codigo
    myAuto.refLegislacao = myLeg.id
  } catch(e) { mensagens.push(errosAE.csv27) }

  // entidades
  var myEntidades = []
  if(req.doc[0].entidade != '') {
    var ents = req.doc[0].entidade.split("###")
    for(var i=0; i < ents.length - 1; i++){
        var e = {}

        var sep = ents[i].split(" - ")
        if(sep[0].charAt(0) == ',') e.entidade = sep[0].substring(1); // remover vírgula a mais
        else e.entidade = sep[0]
        e.designacao = sep[1]

        myEntidades.push(e)
    }
  }
  myAuto.entidades = myEntidades

  var agsCodjaComPai = []   
  var agsRefjaComPai = []
  // classes
  var myClasses = []
  var maplinhas = new Map();
  for(var i=0; i < classes.length; i++){
      var c = {}
      c.id = myAuto.id + "_classe_" + i 
      c.codigo = classes[i].codigo.trim()
      c.referencia = classes[i].referencia.trim()
      c.dataInicial = classes[i].dataInicial.trim()
      c.dataFinal = classes[i].dataFinal.trim()
      c.numAgregacoes = classes[i].numAgregacoes.trim()
      c.medicaoPapel = classes[i].medicaoPapel.trim()
      c.medicaoDigital = classes[i].medicaoDigital.trim()
      c.medicaoOutro = classes[i].medicaoOutro.trim()
      c.dono = classes[i].dono.trim()
      
      // agregacoes
      var myAgregs = []
      var linhas = []
      
      if(agregs != undefined) {
        for(var x=0; x < agregs.length; x++){
          if((agregs[x].referencia != '' && agregs[x].referencia == c.referencia) || (agregs[x].codigoClasse != '' && agregs[x].codigoClasse == c.codigo)) {
            var a = {}
            a.valor = true
            a.codigo = agregs[x].codigoClasse.trim()
            a.referencia = agregs[x].referencia.trim()
            a.codigoAgregacao = agregs[x].codigoAgregacao.trim()
            a.titulo = agregs[x].titulo.trim()
            a.dataContagem = agregs[x].dataInicioContagemPCA.trim()
            a.ni = agregs[x].intervencao.trim()
            if(a.referencia != '' && a.referencia == c.referencia) agsRefjaComPai.push(a.referencia)
            if(a.codigo != '' && a.codigo == c.codigo) agsCodjaComPai.push(a.codigo)
            myAgregs.push(a)
            linhas.push(x)
          }
        }   
        if(myAgregs.length > 0) c.numAgregacoes = myAgregs.length   
      } else {
        subAgreg = false
      }
      maplinhas.set(i,linhas) // MAP - Index da classe | Array das linhas das suas agregações
      c.agregacoes = myAgregs // caso não se tenha submetido um ficheiro de agregações, fica vazio
      myClasses.push(c)
  }

  var tipo = req.doc[0].tipo

  if(agregs != undefined) { // verificar agregações orfãs
    for(var g=0; g < agregs.length; g++){
      if(agregs[g].codigoClasse || agregs[g].referencia || agregs[g].codigoAgregacao || agregs[g].titulo || agregs[g].dataInicioContagemPCA || agregs[g].intervencao) { // linhas vazias
        if(!(agsCodjaComPai.includes(agregs[g].codigoClasse) || agsRefjaComPai.includes(agregs[g].referencia))){
          // 2 - codigoClasse (I)
          if(tipo != "PGD" && tipo != "RADA" && tipo != "RADA_CLAV"){
            if(agregs[g].codigoClasse == '') // codigo vazio
              mensagens.push(errosAE.csv28 + (g+2));
            else // código não corresponde a nenhum código do ficheiro de classes
              mensagens.push(errosAE.csv29 + (g+2));
          }
          else 
            // 2 - codigoClasse (I) e 3 - referencia 
            mensagens.push(errosAE.csv30 + (g+2) );
        }
      }
    }
  }
  if (mensagens.length > 0)
    return res.status(517).jsonp(
      {
        mensagem: errosAE.csv31_517,
        erros: mensagens
      });
  else {
    myAuto.classes = myClasses

    req.linhas = maplinhas
    req.subAgreg = subAgreg
    req.doc = myAuto
    req.import = "csv"
    next()
  }
}

validaSemantica = async function(req, res, next){
  //####################################################################
  var tipo = req.doc.tipo.slice(3)
  var idTS = ''
  var pgds = ''
  var myPGD = ''
  var codigos = ''
  var referencias = ''

  if(tipo == "PGD_LC") {
    try { pgds = await PGD.listarLC() }
    catch(e) { res.status(518).jsonp({ mensagem: errosAE.csv32_518, erros: []}); }
  }
  else {
    if(tipo == "PGD") {
     try { pgds = await PGD.listar() }
     catch(e) { res.status(519).jsonp({ mensagem: errosAE.csv33_519, erros: []}); }
    } else {
      if(tipo == "RADA")
        try { pgds = await PGD.listarRADA() }
        catch(e) { res.status(520).jsonp({ mensagem: errosAE.csv34_520, erros: []});}
    }
  } 

  if(tipo == "PGD" || tipo == "PGD_LC") {
    try { 
      idTS = req.doc.legislacao.split(' ')[1]
      var idPGD = pgds.find(x => x.idLeg == ('leg_' + idTS)).idPGD;
      myPGD = await PGD.consultar(idPGD) }
    catch(e) { res.status(521).jsonp({ mensagem: errosAE.csv35_521, erros: []}); }
    codigos = myPGD.map(classe => classe.codigo)
    if(tipo == "PGD")
      referencias = myPGD.map(classe => classe.referencia);
  }
  else
    if(tipo == "RADA") {
      try { 
        idTS = req.doc.legislacao.split(' ')[1]
        var idPGD = pgds.find(x => x.idLeg == ('leg_' + idTS)).idRADA;
        myPGD = await PGD.consultarRADA(idPGD) }
      catch(e){ res.status(522).jsonp({ mensagem: errosAE.csv36_522, erros: []}); }
      codigos = myPGD.map(classe => classe.codigo);
      referencias = myPGD.map(classe => classe.referencia);
    }

  //####################################################################

    var tempoAtual = new Date()
    var anoAtual = tempoAtual.getFullYear()
    var anoRegEx = /\d\d\d\d/

    var linhas = new Map();
    if(req.import == "csv") 
      linhas = req.linhas 
      
    var mensCodRef = [] // mensagens de erro sobre o código e referência 
    var mensagens = [] // mensagens de erro sobre o resto dos dados

    var classes = req.doc.classes
    var infoEtapa = ""

    for(var i=0; i < classes.length; i++){

      // Ignora linhas vazias
      if(classes[i].codigo || classes[i].referencia || classes[i].dataInicial || classes[i].dataFinal || classes[i].numAgregacoes || classes[i].medicaoPapel || classes[i].medicaoDigital || classes[i].medicaoOutro ) {
        var pca = ''
        var df = ''
        var classVal = true
        var codref = 1 // 1 = cod válido || 2 = ref válida 
      
        // 2 - codigo (PGD/LC)
        if(tipo != "PGD" && tipo != "RADA" && tipo != "RADA_CLAV"){
          if(classes[i].codigo == ''){ // codigo vazio
            mensCodRef.push(req.import == "csv" ? errosAE.csv37 + (i+2) : errosAE.jsonxml37 + "em que ocorre tal erro.");
            classVal = false
          }
          else if(!codigos.includes(classes[i].codigo)){ // codigo preenchido inválido
            mensCodRef.push(req.import == "csv" ? errosAE.csv38 + (i+2) : errosAE.jsonxml38 + "com o código inválido " + classes[i].codigo);
            classVal = false
          }
        } else {  // 3 - codigo / referencia (PGD e RADA)
          // 3.1 - referencia (prioridade na referencia)
          if(classes[i].referencia != ''){
            if(!referencias.includes(classes[i].referencia)){ // referencia preenchida inválida
              if(classes[i].codigo != ''){
                if(!codigos.includes(classes[i].codigo)){ // referencia preenchida inválida + codigo preenchido inválido
                  mensCodRef.push(req.import == "csv" ? errosAE.csv39 + (i+2) : errosAE.jsonxml39 + "com a referência inválida " + classes[i].referencia + " e com o código inválido " + classes[i].codigo);
                  classVal = false
                }
              } else{ // referencia preenchida inválida + codigo vazio
                mensCodRef.push(req.import == "csv" ? errosAE.csv40 + (i+2) : errosAE.jsonxml40 + "com a referência inválida " + classes[i].referencia);
                classVal = false
              }
            }
            else // referencia preenchida válida
              codref = 2
          } 
          // 3.2 - codigo 
          else{ // referencia não preenchida -> vamos verificar codigo
            if(classes[i].codigo != ''){
              if(!codigos.includes(classes[i].codigo)){ // codigo preenchido inválido
                mensCodRef.push(req.import == "csv" ? errosAE.csv41 + (i+2) : errosAE.jsonxml41 + "com o código inválido " + classes[i].codigo);
                classVal = false
              }
            } else{ // codigo e referencia vazios
              mensCodRef.push(req.import == "csv" ? errosAE.csv42 + (i+2) : errosAE.jsonxml42 + "em que ocorre tal erro.");
              classVal = false
            }
          }
        }

        //####################################################################
        
        if(classVal) { // se não tiver codigo ou referencia válidos, não avança
          
          var erroJX = ""

          // Vai buscar a classe à TS 
          var a = []
          if(codref == 1){  // codigo
            a = myPGD.filter(c => c.codigo ==  classes[i].codigo)
            erroJX = "com o código " + classes[i].codigo
          } else if(codref == 2){ // referencia
            a = myPGD.filter(c => c.referencia == classes[i].referencia)
            erroJX = "com a referência " + classes[i].referencia
          } 

          // Verificação extra: só se aceitam classes com PCA e DF 
          if(a.length > 0){ 

            if(codref == 1){ // quando o código é válido, a referência, se tiver sido preenchida, é logo substituída pelo referência obtida ao consultar a classe
              if(classes[i].hasOwnProperty('referencia') && classes[i].referencia != '')
                req.doc.classes[i].referencia = a[0].referencia
            } 
            if(codref == 2){ // quando a referência é válida, o código, se tiver sido preenchido, é logo substituído pelo código obtido ao consultar a classe
              if(classes[i].hasOwnProperty('codigo') && classes[i].codigo != '')
                req.doc.classes[i].codigo = a[0].codigo
            } 

            if(!a[0].hasOwnProperty('df')){
              if(tipo == "TS_LC" || tipo == "PGD_LC")
                mensagens.push(req.import == "csv" ? errosAE.csv43 + (i+2) : errosAE.jsonxml43 + erroJX);
              else
                mensagens.push(req.import == "csv" ? errosAE.csv44 + (i+2) : errosAE.jsonxml44 + erroJX);
              classVal = false;
            } else if(!a[0].hasOwnProperty('pca')){
              if(tipo == "TS_LC" || tipo == "PGD_LC")
                mensagens.push(req.import == "csv" ? errosAE.csv45 + (i+2) : errosAE.jsonxml45 + erroJX);
              else
                mensagens.push(req.import == "csv" ? errosAE.csv46 + (i+2) : errosAE.jsonxml46 + erroJX);
              classVal = false;
            } else {
              pca = a[0].pca
              df = a[0].df
            }
          } else{
            classVal = false;
            mensagens.push(req.import == "csv" ? errosAE.csv47 + (i+2) : errosAE.jsonxml47 + erroJX);
          }

          if(classVal){ // se tiver havido erro ao consultar a classe ou o df/pca, não avança

            // Verificação extra II (PGDs e RADAs): se o DF for Conservação, o AE é inválido
            if(tipo == "PGD" || tipo == "RADA" || tipo == "RADA_CLAV"){
              if(df == "C"){
                mensagens.push(req.import == "csv" ? errosAE.csv48 + (i+2) : errosAE.jsonxml48 + erroJX);
                classVal = false;
              }
            }

            if(classVal){ // se o df for conservação (para PGDs e RADAs), o AE é inválido, não avança

              var pcaNota = false 
              var dfNota = false

              // Verificação extra III: verificar se os campos notas do PCA e DF estão preenchidos
              if(codref == 1 && tipo == "PGD_LC") { // só se verifica no caso de ter código válido + tipo = PGD_LC
                try { 
                  dadosPCA = await Classes.pca('c' + classes[i].codigo)
                  dadosDF = await Classes.df('c' + classes[i].codigo)
                  if(dadosPCA[0].hasOwnProperty('notas') && dadosPCA[0].notas.length > 0){
                    infoEtapa += ("PCA da classe " + classes[i].codigo + ": " + dadosPCA[0].notas)
                    pcaNota = true
                  }
                  if(dadosDF[0].hasOwnProperty('notas') && dadosDF[0].notas.length > 0){
                    infoEtapa += ("DF da classe " + classes[i].codigo + ": " + dadosDF[0].notas)
                    dfNota = true
                  }
                }
                catch(e) {
                  mensagens.push(req.import == "csv" ? errosAE.csv49 + (i+2) : errosAE.jsonxml49 + erroJX);
                }
              }

              var pcaNE = false

              // Verificação extra IV: se PCA e/ou DF = NE, notas têm de estar preenchidas
              if(pca ==  "NE"){
                pcaNE = true
                if(!pcaNota)
                  mensagens.push(req.import == "csv" ? errosAE.csv50 + (i+2) : errosAE.jsonxml50 + erroJX);
              }
              if(df == "NE"){
                if(!dfNota)
                  mensagens.push(req.import == "csv" ? errosAE.csv51 + (i+2) : errosAE.jsonxml51 + erroJX);
              }

            //####################################################################

              // 4 - dataInicial
              if(classes[i].dataInicial == '') // Campo vazio
                mensagens.push(req.import == "csv" ? errosAE.csv52 + (i+2) : errosAE.jsonxml52 + erroJX);
              else{
                if(!anoRegEx.test(classes[i].dataInicial) || (classes[i].dataInicial.length != 4)) // Campo mal preenchido : formato de data errado
                  mensagens.push(req.import == "csv" ? errosAE.csv53 + (i+2) : errosAE.jsonxml53 + erroJX);
                else
                  if(Number(anoAtual) - Number(classes[i].dataInicial) > 100) // Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
                    mensagens.push(req.import == "csv" ? errosAE.csv54 + (i+2) : errosAE.jsonxml54 + erroJX);
              }

              // 5 - dataFinal
              if(classes[i].dataFinal == '') // Campo vazio
                mensagens.push(req.import == "csv" ? errosAE.csv55 + (i+2) : errosAE.jsonxml55 + erroJX);
              else{
                if(!anoRegEx.test(classes[i].dataFinal) || (classes[i].dataFinal.length != 4)) // Campo mal preenchido : formato de data errado
                  mensagens.push(req.import == "csv" ? errosAE.csv56 + (i+2) : errosAE.jsonxml56 + erroJX);
                else{
                  if(Number(anoAtual) - Number(classes[i].dataFinal) > 100) // Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
                    mensagens.push(req.import == "csv" ? errosAE.csv57 + (i+2) : errosAE.jsonxml57 + erroJX);
                  else
                    if(classes[i].dataInicial != '' && Number(classes[i].dataFinal) < Number(classes[i].dataInicial)) // Campo mal preenchido: ano final inferior ao ano inicial + ano inicial superior ao ano final
                      mensagens.push(req.import == "csv" ? errosAE.csv58 + (i+2) : errosAE.jsonxml58 + erroJX);
                }
              }

              // 6 - numAgregacoes
              if(!req.subAgreg && req.import == "csv"){ // não foi submitido um ficheiro de agregações (no caso de importação por csv)
                if(classes[i].numAgregacoes == '') // Campo vazio
                  mensagens.push(errosAE.csv59 + (i+2));
                else
                  if(!(/^(0|([1-9]\d*))$/.test(classes[i].numAgregacoes))) // Campo mal preenchido: outros formatos de números
                    mensagens.push(errosAE.csv60 + (i+2));
              }
              else{ // foi submitido um ficheiro de agregações ou foi importação por json/xml
                if(classes[i].agregacoes.length <= 0) {
                  if(classes[i].numAgregacoes == '' || (!(/^(0|([1-9]\d*))$/.test(classes[i].numAgregacoes)))){
                    if(tipo == "TS_LC" || tipo == "PGD_LC")
                      mensagens.push(req.import == "csv" ? errosAE.csv61 + (i+2) : errosAE.jsonxml61 + erroJX);
                    else
                      mensagens.push(req.import == "csv" ? errosAE.csv62 + (i+2) : errosAE.jsonxml62 + erroJX);
                  }
                }
              }
              
              // 7 - medicaoPapel / medicaoDigital / medicaoOutro
              if(classes[i].medicaoPapel == '' && classes[i].medicaoDigital == '' && classes[i].medicaoOutro == '')// Os 3 campos da medicação vazios
                mensagens.push(req.import == "csv" ? errosAE.csv63 + (i+2) : errosAE.jsonxml63 + erroJX);
              else{
                if(classes[i].medicaoPapel != undefined && classes[i].medicaoPapel != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoPapel))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(req.import == "csv" ? errosAE.csv64 + (i+2) : errosAE.jsonxml64 + erroJX);
                if(classes[i].medicaoDigital != undefined && classes[i].medicaoDigital != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoDigital))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(req.import == "csv" ? errosAE.csv65 + (i+2) : errosAE.jsonxml65 + erroJX);
                if(classes[i].medicaoOutro != undefined && classes[i].medicaoOutro != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoOutro))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(req.import == "csv" ? errosAE.csv66 + (i+2) : errosAE.jsonxml66 + erroJX);
              }

              // 8 - dono
              if(tipo != "PGD" && tipo != "RADA" && tipo != "RADA_CLAV"){
                if(df == "C") { // Só verificamos caso o destino final seja Conservação
                  if(classes[i].dono == '') // Campo vazio
                    mensagens.push(req.import == "csv" ? errosAE.csv67 + (i+2) : errosAE.jsonxml67 + erroJX);
                  else{
                    var ents = []
                    ents = classes[i].dono.split("#")
                    for(var j=0; j < ents.length; j++){
                      if(ents[j].length > 0){ // Ignora donos "vazios" (no caso do último caracter ser #)
                        var resu = State.getEntidade("ent_" + ents[j]) // Entidade
                        if(!resu){ 
                          var resu = State.getTipologia("tip_" + ents[j]) // Tipologia
                          if(!resu) // Campo mal preenchido: valores que não constam no campo Designação do catálogo de entidades da CLAV
                            mensagens.push(req.import == "csv" ? errosAE.csv68 + (i+2) : errosAE.jsonxml68 + erroJX);
                        } 
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      var agregacoes = classes[i].agregacoes
      var codsagreg = []

      var lin = []
      if(req.import == "csv") 
        lin = linhas.get(i)

      // Converter medições e numAgregacoes para números 
      if(mensagens.length <= 0 && mensCodRef.length <= 0) { 
        if(req.doc.classes[i].hasOwnProperty('numAgregacoes'))
          req.doc.classes[i].numAgregacoes = Number(req.doc.classes[i].numAgregacoes)
        if(req.doc.classes[i].hasOwnProperty('medicaoPapel') && req.doc.classes[i].medicaoPapel.length != '')
          req.doc.classes[i].medicaoPapel = Number(req.doc.classes[i].medicaoPapel.replace(',','.'))
        if(req.doc.classes[i].hasOwnProperty('medicaoDigital') && req.doc.classes[i].medicaoDigital != '')
          req.doc.classes[i].medicaoDigital = Number(req.doc.classes[i].medicaoDigital.replace(',','.'))
        if(req.doc.classes[i].hasOwnProperty('medicaoOutro') && req.doc.classes[i].medicaoOutro != '')
          req.doc.classes[i].medicaoOutro = Number(req.doc.classes[i].medicaoOutro.replace(',','.'))
      }

      if(classVal){
        for(var j=0; j < agregacoes.length; j++){
          
          var li = ''
          if(req.import == "csv") 
            li = lin[j] 
          else
            li = j

          // Ignora linhas vazias
          if(agregacoes[j].codigo || agregacoes[j].referencia || agregacoes[j].codigoAgregacao || agregacoes[j].titulo || agregacoes[j].dataContagem || agregacoes[j].ni) {

            // 4 - codigoAgregacao
            if(agregacoes[j].codigoAgregacao == '') // Campo vazio
              mensagens.push(req.import == "csv" ? errosAE.csv69 + (i+2) : errosAE.jsonxml69 + erroJX);
            else{
              if(codsagreg.length == 0) // (primeiro código)
                codsagreg[0] = agregacoes[j].codigoAgregacao
              else {
                if(codsagreg.includes(agregacoes[j].codigoAgregacao)) // Campo mal preenchido: agregações com o mesmo código da agregação / UI na mesma classe / série
                  mensagens.push(req.import == "csv" ? errosAE.csv70 + (i+2) : errosAE.jsonxml70 + erroJX);
                else
                  codsagreg.push(agregacoes[j].codigoAgregacao)
              }
            }

            // 5 - titulo
            if(agregacoes[j].titulo == '') // Campo vazio
              mensagens.push(req.import == "csv" ? errosAE.csv71 + (i+2) : errosAE.jsonxml71 + erroJX);

            // 6 - dataInicioContagemPCA
            if(agregacoes[j].dataContagem == '') // Campo vazio
              mensagens.push(req.import == "csv" ? errosAE.csv72 + (i+2) : errosAE.jsonxml72 + erroJX);
            else{
              if(!anoRegEx.test(agregacoes[j].dataContagem) || (agregacoes[j].dataContagem.length != 4)) // Campo mal preenchido : formato de data errado
                mensagens.push(req.import == "csv" ? errosAE.csv73 + (i+2) : errosAE.jsonxml73 + erroJX);
              else
                if(!pcaNE && (Number(agregacoes[j].dataContagem) > (Number(anoAtual) - (Number(pca) + 1)))) // Campo mal preenchido
                  mensagens.push(req.import == "csv" ? errosAE.csv74 + (i+2) : errosAE.jsonxml74 + erroJX); 
            }

            // 7 - intervencao
            if(tipo != "PGD" && tipo != "RADA" && tipo != "RADA_CLAV"){
              if(agregacoes[j].ni == ''){ // Campo vazio
                if(df == "C")
                  mensagens.push(req.import == "csv" ? errosAE.csv75 + (i+2) : errosAE.jsonxml75 + erroJX); 
                else
                  mensagens.push(req.import == "csv" ? errosAE.csv76 + (i+2) : errosAE.jsonxml76 + erroJX); 
              } else{
                if(df == "C")
                  if(!/participante/i.test(agregacoes[j].ni)) // Campo mal preenchido: com outros valores que não Participante.
                    mensagens.push(req.import == "csv" ? errosAE.csv77 + (i+2) : errosAE.jsonxml77 + erroJX); 
                else
                  if(!/participante/i.test(agregacoes[j].ni) && !/dono/i.test(agregacoes[j].ni)) // Campo mal preenchido: com outros valores que não Dono ou Participante.
                    mensagens.push(req.import == "csv" ? errosAE.csv78 + (i+2) : errosAE.jsonxml78 + erroJX); 
              }
            }
          } 
          codref = 1 //reset
        }
      }
    }
    
    req.infoEtapa = infoEtapa
    if(mensCodRef.length > 0 || mensagens.length > 0) {
      if(mensCodRef.length > 0) mensagens = mensCodRef
      res.status(523).jsonp(
        {
          mensagem: (req.import == "csv") ? errosAE.csv79_523 
                  : (req.import == "json") ? errosAE.json79_523 
                  : errosAE.xml79_523,
          erros: mensagens
        });     
    } else 
      next()
}

/* ----------------------------------------------------------------------------
   IMPORTAÇÂO DE UM AE A PARTIR DE 1 OU 2 FICHEIROS CSV
   ---------------------------------------------------------------------------- */
router.post("/importarCSV",
  Auth.isLoggedInUser,
  Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  validaEstruturaCSV,
  convFormatoIntermedioCSV,
  validaSemantica,
  (req, res) => {
    User.getUserById(req.user.id, function (erro, user) {
      if (erro) 
        res.status(524).json({
          mensagem: errosAE.csv80_524,
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, req.infoEtapa, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: errosAE.csv81_201 + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => {
            res.status(525).jsonp({
              mensagem: errosAE.csv82_525,
              erros: erro
            });
          })
      }
    })
  }
)
  
/* ----------------------------------------------------------------------------
   IMPORTAÇÂO DE UM AE EM JSON
   ---------------------------------------------------------------------------- */
router.post(
  "/importarJSON",
  Auth.isLoggedInUser,
  Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  validaEstruturaJSON,
  convFormatoIntermedioJSON,
  validaSemantica,
  (req, res) => {
    User.getUserById(req.user.id, function (erro, user) {
      if(erro)
        res.status(524).json({
          mensagem: errosAE.csv80_524,
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, req.infoEtapa, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: errosAE.csv81_201 + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => {
            res.status(525).jsonp({
              mensagem: errosAE.csv82_525,
              erros: erro
            });
          })
      }
    })
  }
)

/* ----------------------------------------------------------------------------
   IMPORTAÇÂO DE UM AE EM XML
   ---------------------------------------------------------------------------- */
router.post( "/importarXML", 
  Auth.isLoggedInUser, 
  Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  validaEstruturaXML,
  convFormatoIntermedioXML,
  validaSemantica,
  [estaEm("query", "tipo", vcFonte)],
  (req, res) => {
    User.getUserById(req.user.id, function (erro, user) {
      if(erro)
        res.status(524).json({
          mensagem: errosAE.csv80_524,
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, req.infoEtapa, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: errosAE.csv81_201 + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => {
            res.status(525).jsonp({
              mensagem: errosAE.csv82_525,
              erros: erro
            });
          })
      }
    })
  }
);

module.exports = router;
