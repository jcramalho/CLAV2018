var Auth = require("../../controllers/auth.js");
var AutosEliminacao = require("../../controllers/api/autosEliminacao.js");
var Classes = require("../../controllers/api/classes.js");
var User = require("../../controllers/api/users.js");
var excel2Json = require("../../controllers/conversor/xslx2json");
var xml2Json = require("../../controllers/conversor/aeXml2Json");
var json2Json = require("../../controllers/conversor/aeJSONl2Json");
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

//Importar um AE em JSON (Inserir ficheiro diretamente pelo Servidor)
validaEstruturaJSON = function(req, res, next){
  var form = new formidable.IncomingForm();
      form.parse(req, async (error, fields, formData) => {
        if (error)
          res.status(500).send(`Erro ao importar Auto de Eliminação: ${error}`);
        else if (!formData.file || !formData.file.path)
          res.status(500).send(`Erro ao importar Auto de Eliminação: o campo file tem de vir preenchido`);
        else if (formData.file.type == "application/json") {
  
          var schemaPath = __dirname + "/../../public/schema/autoEliminacao.json";
          var schemaJSON = fs.readFileSync(schemaPath);
          var schema = JSON.parse(schemaJSON);
  
          const validate = ajv.compile(schema)
          var docJSON = fs.readFileSync(formData.file.path);
          var doc = JSON.parse(docJSON)
          const valid = validate(doc)

          if (!valid) 
            res.status(500).send("Erro(s) na análise estrutural do ficheiro JSON: " + validate.errors);
          else {
            // Se a validação tiver sucesso, o objeto é colocado em req.doc para 
            // quem vier a seguir...
            req.doc = doc
            next()
          }
        }
      })
}

convFormatoIntermedio = function(req, res, next){
  var mensagens = [] // Mensagens de erro
  var myAuto = req.doc

  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)

  // legislacao
  var myLeg = State.getLegislacaoByCodigo(myAuto.legislacao.slice(4)) 
  if(myLeg) {
    myAuto.legislacao = myAuto.tipo + " " + myLeg.codigo
    myAuto.refLegislacao = myAuto.legislacao
  } else { 
    mensagens.push("Erro ao recuperar a legislação (o tipo ou o número da legislação não vieram preenchido(s)).") 
  }

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
  return res.status(505).jsonp(
    {
      mensagem: errosAE.csv29_517,
      erros: mensagens
    });
  else {
    req.doc = myAuto
    req.import = "json"
    next()
  }
}

// ---------------- IMPORTAÇÃO EM 2 FICHEIROS CSV -------------------

validaEstruturaCSV = async function(req, res, next){
  var form = new formidable.IncomingForm()

  form.parse(req, async (error, fields, formData) => {
    if (error)
      res.status(500).jsonp({mensagem: `${errosAE.csv1_512} ${error}`, erros: []});
    else if (!formData.file || !formData.file.path)
      res.status(501).jsonp({mensagem: `${errosAE.csv2_513}`, erros: []});
    else if (formData.file.type == "text/csv" || formData.file.type == "application/vnd.ms-excel") {
      var file = fs.readFileSync(formData.file.path, 'utf8')
      Papa.parse(file, {
        skipEmptyLines: "greedy",
        header: true,
        transformHeader:function(h) {
          return h.trim();
        },
        complete: async function(results) {
          var f1 = results.data
          var linha = results.data[0]
          var mensagens = []

          if(f1.length != 0){
            if((Object.keys(linha).length) != 9)
              mensagens.push(errosAE.csv3);
            if(!linha.hasOwnProperty('codigo')) mensagens.push(errosAE.csv4);
            if(!linha.hasOwnProperty('referencia')) mensagens.push(errosAE.csv5);
            if(!linha.hasOwnProperty('dataInicial')) mensagens.push(errosAE.csv6);
            if(!linha.hasOwnProperty('dataFinal')) mensagens.push(errosAE.csv7);
            if(!linha.hasOwnProperty('numAgregacoes')) mensagens.push(errosAE.csv8);
            if(!linha.hasOwnProperty('medicaoPapel')) mensagens.push(errosAE.csv9);
            if(!linha.hasOwnProperty('medicaoDigital')) mensagens.push(errosAE.csv10);
            if(!linha.hasOwnProperty('medicaoOutro')) mensagens.push(errosAE.csv11);
            if(!linha.hasOwnProperty('dono')) mensagens.push(errosAE.csv12);
          }
          else
            mensagens.push(errosAE.csv13);

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
                        mensagens2.push(errosAE.csv14);
                      if(!linha.hasOwnProperty('codigoClasse')) mensagens2.push(errosAE.csv15);
                      if(!linha.hasOwnProperty('referencia')) mensagens2.push(errosAE.csv16);
                      if(!linha.hasOwnProperty('codigoAgregacao')) mensagens2.push(errosAE.csv17);
                      if(!linha.hasOwnProperty('titulo')) mensagens2.push(errosAE.csv18);
                      if(!linha.hasOwnProperty('dataInicioContagemPCA')) mensagens2.push(errosAE.csv19);
                      if(!linha.hasOwnProperty('intervencao')) mensagens2.push(errosAE.csv20);
                    }
                    else
                      mensagens2.push(errosAE.csv21);

                    if (mensagens.length > 0 || mensagens2.length > 0) {
                      let mens = []
                      for(var i=0; i < mensagens.length; i++)
                        mens.push(mensagens[i])
                      for(var j=0; j < mensagens2.length; j++)
                        mens.push(mensagens2[j])
                      return res.status(502).jsonp({
                        mensagem: errosAE.csv22_514,
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
              res.status(503).jsonp({
                mensagem: errosAE.csv23_515,
                erros: mensagens
              })
          } else { // SÓ FICHEIRO DAS CLASSES
            if (mensagens.length > 0)
              return res.status(502).jsonp({
                mensagem: errosAE.csv22_502,
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
        res.status(504).jsonp({
          mensagem: errosAE.csv24_516,
          erros: mensagens
        })
  })
}

convCSVFormatoIntermedio = function(req, res, next){
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
    myAuto.refLegislacao = req.doc[0].legitimacao
  } catch(e) { mensagens.push(errosAE.csv25) }

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
          if(tipo != "PGD" && tipo != "RADA"){
            if(agregs[g].codigoClasse == '') // codigo vazio
              mensagens.push(errosAE.csv26 + (g+2));
            else // código não corresponde a nenhum código do ficheiro de classes
              mensagens.push(errosAE.csv27 + (g+2));
          }
          else 
            // 2 - codigoClasse (I) e 3 - referencia 
            mensagens.push(errosAE.csv28 + (g+2) );
        }
      }
    }
  }
  if (mensagens.length > 0)
    return res.status(505).jsonp(
      {
        mensagem: errosAE.csv29_517,
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
  var numDiploma = ''
  var pgds = ''
  var myPGD = ''
  var codigos = ''
  var referencias = ''

  if(tipo == "PGD_LC") {
    try { pgds = await PGD.listarLC() }
    catch(e) { res.status(506).jsonp({ mensagem: errosAE.csv30_518, erros: []}); }
  }
  else {
    if(tipo == "PGD") {
     try { pgds = await PGD.listar() }
     catch(e) { res.status(507).jsonp({ mensagem: errosAE.csv31_519, erros: []}); }
    } else {
      if(tipo == "RADA")
        try { pgds = await PGD.listarRADA() }
        catch(e) { res.status(508).jsonp({ mensagem: errosAE.csv32_520, erros: []});}
    }
  } 

  if(tipo == "PGD" || tipo == "PGD_LC") {
    numDiploma = /\d+_\d+/.exec(req.doc.legislacao)[0]
    var idPGD = pgds.find(x => x.numero == numDiploma).idPGD;
    try { myPGD = await PGD.consultar(idPGD) }
    catch(e) { res.status(509).jsonp({ mensagem: errosAE.csv33_521, erros: []}); }
    codigos = myPGD.map(classe => classe.codigo);
    if(tipo == "PGD")
      referencias = myPGD.map(classe => classe.referencia);
  }
  else
    if(tipo == "RADA") {
      numDiploma = req.doc.legislacao.split(' ')[2]
      var idPGD = pgds.find(x => x.numero == numDiploma).idRADA;
      try { myPGD = await PGD.consultarRADA(idPGD) }
      catch(e){ res.status(510).jsonp({ mensagem: errosAE.csv34_522, erros: []}); }
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
        if(tipo != "PGD" && tipo != "RADA"){
          if(classes[i].codigo == ''){ // codigo vazio
            mensCodRef.push(errosAE.csv35 + (i+2));
            classVal = false
          }
          else if(!codigos.includes(classes[i].codigo)){ // codigo preenchido inválido
            mensCodRef.push(errosAE.csv36 + (i+2));
            classVal = false
          }
        } else {  // 3 - codigo / referencia (PGD e RADA)
          // 3.1 - referencia (prioridade na referencia)
          if(classes[i].referencia != ''){ 
            if(!referencias.includes(classes[i].referencia)){ // referencia preenchida inválida
              if(classes[i].codigo != ''){ 
                if(!codigos.includes(classes[i].codigo)){ // referencia preenchida inválida + codigo preenchido inválido
                  mensCodRef.push(errosAE.csv37 + (i+2));
                  classVal = false
                }
              }
              else{ // referencia preenchida inválida + codigo vazio
                mensCodRef.push(errosAE.csv38 + (i+2));
                classVal = false
              }
            }
            else{ // referencia preenchida válida
              codref = 2
            }
          } 
          // 3.2 - codigo 
          else{ // referencia não preenchida -> vamos verificar codigo
            if(classes[i].codigo != ''){ 
              if(!codigos.includes(classes[i].codigo)){ // codigo preenchido inválido
                mensCodRef.push(errosAE.csv39 + (i+2));
                classVal = false
              }
            }
            else{ // codigo e referencia vazios
              mensCodRef.push(errosAE.csv40 + (i+2));
              classVal = false
            }
          }
        }

        //####################################################################
        
        if(classVal) { // se não tiver codigo ou referencia válidos, não avança

          // Vai buscar a classe à TS 
          var a = []
          if(codref == 1){  // codigo
            a = myPGD.filter(c => c.codigo ==  classes[i].codigo)
          } else if(codref == 2){ // referencia
            a = myPGD.filter(c => c.referencia == classes[i].referencia)
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
              mensagens.push(errosAE.csv41 + (i+2));
              classVal = false;
            } else if(!a[0].hasOwnProperty('pca')){
              classVal = false;
              mensagens.push(errosAE.csv42 + (i+2));
            } else {
              pca = a[0].pca
              df = a[0].df
            }
          } else{
            classVal = false;
            mensagens.push(errosAE.csv43);
          }

          if(classVal){ // se tiver havido erro ao consultar a classe ou o df/pca, não avança

            // Verificação extra II (PGDs e RADAs): se o DF for Conservação, o AE é inválido
            if(tipo == "PGD" || tipo == "RADA"){ 
              if(df == "C"){
                mensagens.push(errosAE.csv44 + (i+2));
                var classVal = false;
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
                catch(e) { mensagens.push(errosAE.csv45); }
              }

              var pcaNE = false

              // Verificação extra IV: se PCA e/ou DF = NE, notas têm de estar preenchidas
              if(pca ==  "NE"){
                pcaNE = true
                if(!pcaNota)
                  mensagens.push(errosAE.csv46)
              }
              if(df == "NE")
                if(!dfNota)
                  mensagens.push(errosAE.csv47)
              
            //####################################################################

              // 4 - dataInicial
              if(classes[i].dataInicial == '') // Campo vazio
                mensagens.push(errosAE.csv48 + (i+2));
              else{
                if(!anoRegEx.test(classes[i].dataInicial) || (classes[i].dataInicial.length != 4))  // Campo mal preenchido : formato de data errado
                  mensagens.push(errosAE.csv49 + (i+2));
                else
                  if(Number(anoAtual) - Number(classes[i].dataInicial) > 100) // Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
                    mensagens.push(errosAE.csv50 + (i+2));
              }

              // 5 - dataFinal
              if(classes[i].dataFinal == '') // Campo vazio
                mensagens.push(errosAE.csv51 + (i+2));
              else{
                if(!anoRegEx.test(classes[i].dataFinal) || (classes[i].dataFinal.length != 4)) // Campo mal preenchido : formato de data errado
                  mensagens.push(errosAE.csv52 + (i+2));
                else{
                  if(Number(anoAtual) - Number(classes[i].dataFinal) > 100) // Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
                    mensagens.push(errosAE.csv53 + (i+2));   
                  else 
                    if(classes[i].dataInicial != '' && Number(classes[i].dataFinal) < Number(classes[i].dataInicial)) // Campo mal preenchido: ano final inferior ao ano inicial + ano inicial superior ao ano final
                      mensagens.push(errosAE.csv54 + (i+2));
                }
              }

              // 6 - numAgregacoes
              if(!req.subAgreg && req.import == "csv"){ // não foi submitido um ficheiro de agregações (no caso de importação por csv)
                if(classes[i].numAgregacoes == '') // Campo vazio
                  mensagens.push(errosAE.csv55 + (i+2));
                else
                  if(!(/^(0|([1-9]\d*))$/.test(classes[i].numAgregacoes))) // Campo mal preenchido: outros formatos de números
                    mensagens.push(errosAE.csv56 + (i+2));
              }
              else{ // foi submitido um ficheiro de agregações ou foi importação por json/xml
                if(classes[i].agregacoes.length <= 0) {
                  if(classes[i].numAgregacoes == '' || (!(/^(0|([1-9]\d*))$/.test(classes[i].numAgregacoes))))
                    mensagens.push(errosAE.csv57 + (i+2));
                }
              }
              
              // 7 - medicaoPapel / medicaoDigital / medicaoOutro
              if(classes[i].medicaoPapel == '' && classes[i].medicaoDigital == '' && classes[i].medicaoOutro == '') // Os 3 campos da medicação vazios
                mensagens.push(errosAE.csv58 + (i+2));
              else{
                if(classes[i].medicaoPapel != undefined && classes[i].medicaoPapel != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoPapel))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(errosAE.csv59 + (i+2));
                if(classes[i].medicaoDigital != undefined && classes[i].medicaoDigital != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoDigital))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(errosAE.csv60 + (i+2));
                if(classes[i].medicaoOutro != undefined && classes[i].medicaoOutro != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoOutro))) // Campo mal preenchido: outros formatos de números
                  mensagens.push(errosAE.csv61 + (i+2));
              }

              // 8 - dono
              if(tipo != "PGD" && tipo != "RADA"){
                if(df == "C") { // Só verificamos caso o destino final seja Conservação
                  if(classes[i].dono == '') // Campo vazio
                    mensagens.push(errosAE.csv62 + (i+2));
                  else{
                    var ents = []
                    if(req.import == "csv")
                      ents = classes[i].dono.split("#") 
                    else
                      ents = classes[i].dono
                    for(var j=0; j < ents.length; j++){
                      if(ents[j].length > 0){ // Ignora donos "vazios" (no caso do último caracter ser #)
                        var resu = State.getEntidade("ent_" + ents[j]) // Entidade
                        if(!resu){ 
                          var resu = State.getTipologia("tip_" + ents[j]) // Tipologia
                          if(!resu) // Campo mal preenchido: valores que não constam no campo Designação do catálogo de entidades da CLAV
                            mensagens.push(errosAE.csv62 + (i+2));
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
              mensagens.push(errosAE.csv63 + (li+2));
            else{
              if(codsagreg.length == 0) // (primeiro código)
                codsagreg[0] = agregacoes[j].codigoAgregacao
              else
                if(codsagreg.includes(agregacoes[j].codigoAgregacao)) // Campo mal preenchido: agregações com o mesmo código da agregação / UI na mesma classe / série
                  mensagens.push(errosAE.csv64 + (li+2));
                else 
                  codsagreg.push(agregacoes[j].codigoAgregacao)
            }

            // 5 - titulo
            if(agregacoes[j].titulo == '') // Campo vazio
              mensagens.push(errosAE.csv65 + (li+2));

            // 6 - dataInicioContagemPCA
            if(agregacoes[j].dataContagem == '') // Campo vazio
              mensagens.push(errosAE.csv66 + (li+2));
            else{
              if(!anoRegEx.test(agregacoes[j].dataContagem) || (agregacoes[j].dataContagem.length != 4)) // Campo mal preenchido : formato de data errado
                mensagens.push(errosAE.csv67 + (li+2));
              else {
                if(!pcaNE && (Number(agregacoes[j].dataContagem) > (Number(anoAtual) - (Number(pca) + 1))))  // Campo mal preenchido
                  mensagens.push(errosAE.csv68 + (li+2));     
              }
            }

            // 7 - intervencao
            if(tipo != "PGD" && tipo != "RADA"){
              if(df == "E") { // Só verificamos caso o destino final seja Eliminação
                if(agregacoes[j].ni == '') // Campo vazio em classes / séries de eliminação
                  mensagens.push(errosAE.csv69 + (li+2));
                else
                  // Campo mal preenchido: com outros valores que não Dono ou Participante.
                  if( !/participante/i.test(agregacoes[j].ni) && !/dono/i.test(agregacoes[j].ni) ) 
                    mensagens.push(errosAE.csv69 + (li+2));   
              }
            }
          } 
          codref = 1 //reset
        }
      }
    }
    
    req.infoEtapa = infoEtapa
    if(mensagens.length > 0) {
      if(mensCodRef.length > 0) mensagens = mensCodRef
      res.status(514).jsonp(
        {
          mensagem: errosAE.csv70_523,
          erros: mensagens
        });     
    } else 
      next()
}

/* ----------------------------------------------------------------------------
   IMPORTAÇÂO DE UM AE A PARTIR DE 2 FICHEIROS CSV
   ---------------------------------------------------------------------------- */
router.post("/importarCSV",
  Auth.isLoggedInUser,
  Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  validaEstruturaCSV,
  convCSVFormatoIntermedio,
  validaSemantica,
  (req, res) => {
    User.getUserById(req.user.id, function (erro, user) {
      if (erro) 
        res.status(515).json({
          mensagem: errosAE.csv71_524,
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, req.infoEtapa, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: errosAE.csv72_201 + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => {
            res.status(516).jsonp({
              mensagem: errosAE.csv73_525,
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
  convFormatoIntermedio,
  validaSemantica,
  (req, res) => {
    User.getUserById(req.user.id, function (erro, user) {
      if(erro)
        res.status(500).json({
          mensagem: "E500 - Erro na consulta de utilizador para importação do AE:",
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, req.infoEtapa, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: "Auto de Eliminação importado com sucesso e adicionado aos pedidos com codigo: " + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => {
            res.status(501).jsonp({
              mensagem: "E501 - Erro na criação do pedido de importação do AE:",
              erros: erro
            });
          })
      }
    })
  }
)

//Importar um AE em XML (Inserir ficheiro diretamente pelo Servidor)
router.post( "/importar", Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  [estaEm("query", "tipo", vcFonte)],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    var form = new formidable.IncomingForm();
    form.parse(req, async (error, fields, formData) => {
      if (error)
        res.status(500).send(`Erro ao importar Auto de Eliminação: ${error}`);
      else if (!formData.file || !formData.file.path)
        res.status(500).send(`Erro ao importar Auto de Eliminação: o campo file tem de vir preenchido`);
      else if (formData.file.type == "text/xml") {

        var schemaPath = __dirname + "/../../public/schema/autoEliminacao.xsd";
        var schema = fs.readFileSync(schemaPath);
        var xsd = xml.parseXml(schema);
        var doc = fs.readFileSync(formData.file.path);
        var xmlDoc = xml.parseXml(doc);

        if (xmlDoc.validate(xsd)) {
          const parser = new xml2js.Parser();
          parser.parseString(doc, (error, result) => {
            if (error) res.status(500).send("Erro na análise estrutural do ficheiro XML: " + error);
            else {
              User.getUserById(req.user.id, function (err, user) {
                if (err)
                  res.status(500).json(`Erro na consulta de utilizador para importação do AE: ${err}`);
                else {
                  xml2Json(result.autoEliminação, req.query.tipo)
                    .then((data) => {
                      AutosEliminacao.importar(data.auto, req.query.tipo, user)
                        .then((dados) => {
                          res.jsonp({
                            tipo: dados.tipo,
                            codigoPedido: dados.codigo,
                            mensagem: "Auto de Eliminação importado com sucesso e adicionado aos pedidos com codigo: " + dados.codigo
                          }
                          );
                        })
                        .catch((erro) =>
                          res.status(500).json(`Erro na adição do AE: ${erro}`)
                        );
                    })
                    .catch((err) => res.status(500).send(err));
                }
              });
            }
          });
        } else res.status(500).send(xmlDoc.validationErrors);
      } else
        res
          .status(500)
          .send(
            `Erro ao importar Auto de Eliminação, tipo de ficheiro: ${formData.file.type}`
          );
    });
  }
);

module.exports = router;
