var Auth = require("../../controllers/auth.js");
var AutosEliminacao = require("../../controllers/api/autosEliminacao.js");
var User = require("../../controllers/api/users.js");
var excel2Json = require("../../controllers/conversor/xslx2json");
var xml2Json = require("../../controllers/conversor/aeXml2Json");
var json2Json = require("../../controllers/conversor/aeJSONl2Json");
var xml = require("libxmljs");
var xml2js = require("xml2js");
var fs = require("fs");
var Papa = require('papaparse')

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
          else
            // Se a validação tiver sucesso, o objeto é colocado em req.doc para 
            // quem vier a seguir...
            req.doc = doc
            next()
        }
      })
}

// ---------------- IMPORTAÇÃO EM 2 FICHEIROS CSV -------------------

convFormatoIntermedio = function(req, res, next){
  myAuto = req.doc

  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)
  // tipo: AE_...
  myAuto.tipo = 'AE_' + myAuto.tipo
  // id da legislação na BD: vou buscar à cache
  var legIdent = myAuto.legislacao.split(' ')
  var leg = State.getLegislacaoByTipoNumero(legIdent[0], legIdent[1])
  myAuto.refLegislacao = leg.id
  // Entidades
  // vou à cache buscar a info das entidades a partir da sigla
  var myEntidades = myAuto.entidades.map(f => { 
      let ent = State.getEntidade('ent_' + f)
      return ent
  })
  myAuto.entidades = myEntidades.map(e => {return {
      entidade: e.id,
      designacao: e.designacao
  }})

  for(i=0; i < myAuto.classes.length; i++){
    myAuto.classes[i].id = myAuto.id + "_classe_" + i
  }

  req.doc = myAuto
  next()
}

validaEstruturaCSV = async function(req, res, next){
  var form = new formidable.IncomingForm()

  form.parse(req, async (error, fields, formData) => {
    if (error)
      res.status(505).send(`Erro ao importar Auto de Eliminação: ${error} &&&`);
    else if (!formData.file || !formData.file.path)
      res.status(506).send(`Erro ao importar Auto de Eliminação: o campo file tem de vir preenchido. &&&`);
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
          if(!linha.hasOwnProperty('codigo')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna codigo inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('referencia')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna referencia inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('dataInicial')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna dataInicial inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('dataFinal')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna dataFinal inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('numAgregacoes')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna numAgregacoes inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('medicaoPapel')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna medicaoPapel inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('medicaoDigital')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna medicaoDigital inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('medicaoOutro')) mensagens.push("Não foi possível importar o ficheiro de classes / séries. Coluna medicaoOutro inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");

          if(formData.agreg && (formData.agreg.type == "application/vnd.ms-excel" || formData.file.type == "text/csv")) { // AMBOS FICHEIROS
            var file2 = fs.readFileSync(formData.agreg.path, 'utf8')
            Papa.parse(file2, {
                header: true,
                transformHeader:function(h) {
                  return h.trim();
                },
                complete: async function(results) {
                  var linha = results.data[0]
                  var mensagens2 = []
                  if(!linha.hasOwnProperty('codigoClasse')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna codigoClasse inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  if(!linha.hasOwnProperty('referencia')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna referencia inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  if(!linha.hasOwnProperty('codigoAgregacao')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna codigoAgregacao inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  if(!linha.hasOwnProperty('titulo')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna titulo inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  if(!linha.hasOwnProperty('dataInicioContagemPCA')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna dataInicioContagemPCA inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  if(!linha.hasOwnProperty('intervencao')) mensagens2.push("Não foi possível importar o ficheiro de agregações. Coluna intervencao inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
                  
                  if (mensagens.length > 0 || mensagens2.length > 0) {
                    let mens = []
                    if (mensagens.length > 0) mens.push(mensagens)
                    if (mensagens2.length > 0) mens.push(mensagens2)
                    return res.status(507).send("Erro(s) na análise estrutural do(s) ficheiro(s) CSV: &&&" + mens);
                  } else {
                    req.doc = []
                    req.doc.push(fields)
                    req.doc.push(f1)
                    req.doc.push(results.data)
                    next()
                  }
                }
            });
          } else { // SÓ FICHEIRO DAS CLASSES
            if (mensagens.length > 0)
              return res.status(508).jsonp({
                mensagem: "Erro(s) na análise estrutural do(s) ficheiro(s) CSV:",
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
        res.status(509).jsonp({
          mensagem: "Erro ao importar Auto de Eliminação: o ficheiro tem de ser de formato CSV.",
          erros: mensagens
        })
  })
}

convCSVFormatoIntermedio = function(req, res, next){
  var mensagens = [] // Mensagens de erro
  var classes = req.doc[1]
  var agregs = req.doc[2]
  var myAuto = {}
   
  // identificador do AE
  myAuto.id = stripenanoid('ae', options);
  myAuto.data = new Date().toISOString().substring(0,10)

  // tipo
  myAuto.tipo = 'AE_' + req.doc[0].tipo
  
  // legislacao
  var myLeg = /(.*?) (\d*\/\d*)/.exec(req.doc[0].legitimacao)
  if(myLeg && myLeg[1] && myLeg[2]){
    myAuto.legislacao = req.doc[0].tipo + " " + myLeg[1] + " " + myLeg[2]
    // id da legislação na BD
    var leg = State.getLegislacaoByTipoNumero(myLeg[1], myLeg[2])
    myAuto.refLegislacao = leg.id
  }
  else{
    mensagens.push("Erro ao recuperar a legislação: o tipo ou o número da legislação não vieram preenchido(s). Note: tipoLeg número")
  }
  
  // entidades
  var myEntidades = []
  if(req.doc[0].entidade != '') {
    var ents = req.doc[0].entidade.split(",")
    for(var i=0; i < ents.length; i++){
        var e = {}
        var sep = ents[i].split(" - ")
        e.entidade = sep[0]
        e.designacao = sep[1]
        myEntidades.push(e)
    }
  }
  myAuto.entidades = myEntidades

  var agsCodjaComPai = []   
  var agsRefjaComPai = []   

  // classes
  var myClasses = []
  for(var i=0; i < classes.length; i++){
      var c = {}
      c.id = myAuto.id + "_classe_" + i 
      c.codigo = classes[i].codigo
      c.referencia = classes[i].referencia
      c.dataInicio = classes[i].dataInicial
      c.dataFim = classes[i].dataFinal
      c.numAgregacoes = classes[i].numAgregacoes
      c.medicaoPapel = classes[i].medicaoPapel
      c.medicaoDigital = classes[i].medicaoDigital
      c.medicaoOutro = classes[i].medicaoOutro
      c.dono = classes[i].dono

      // agregacoes
      var myAgregs = []

      if(agregs != undefined) {
        var ags = agregs.filter(ag => (ag.referencia != '' && ag.referencia == c.referencia) || (ag.codigoClasse != '' && ag.codigoClasse == c.codigo))
        if(ags.length > 0) {
          c.numAgregacoes = ags.length
          for(var j=0; j < ags.length; j++){
            var a = {}
            a.codigo = ags[j].codigoClasse
            a.referencia = ags[j].referencia
            a.codigoAgregacao = ags[j].codigoAgregacao
            a.titulo = ags[j].titulo
            a.dataContagem = ags[j].dataInicioContagemPCA
            a.ni = ags[j].intervencao
            if(a.referencia != '' && a.referencia == c.referencia) agsRefjaComPai.push(a.referencia)
            if(a.codigo != '' && a.codigo == c.codigo) agsCodjaComPai.push(a.codigo)
            myAgregs.push(a)
          }
        }
      }
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
            if(agregs[g].codigoClasse == '') // Campo vazio
              mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna codigoClasse é obrigatório, sempre que existir código de classificação na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (g+2) + " %%%");
            else // Código não corresponde a nenhum código do ficheiro de classes
              mensagens.push("Não foi possível importar o ficheiro de agregações. Os campos da coluna codigoClasse devem ser preenchidos com os valores do código de classificação existentes na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (g+2) + " %%%");
          }
          else 
            // 2 - codigoClasse (I) e 3 - referencia 
            mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna codigoClasse ou da coluna referencia é obrigatório, sempre que existir código de classificação / número de referência na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (g+2) + " %%%");
        }
      }
    }
  }
  if (mensagens.length > 0)
    return res.status(516).jsonp(
      {
        mensagem: "Erro na informação enviada:",
        erros: mensagens
      });
  else {
    myAuto.classes = myClasses
    myAuto.mensagens = mensagens
    req.doc = myAuto
    next()
  }
}

validaSemantica = async function(req, res, next){
  //####################################################################
  var tipo = req.doc.tipo.slice(3)
  var numDiploma = /\d*\/\d*/.exec(req.doc.legislacao)[0]
  var pgds = ''
  var myPGD = ''
  var codigos = ''
  var referencias = ''
  
  if(tipo == "PGD_LC") {
    try { pgds = await PGD.listarLC() }
    catch(e) { res.status(510).json(`Erro ao listar PGD_LCs &&&`) }
  }
  else {
    if(tipo == "PGD") {
     try { pgds = await PGD.listar() }
     catch(e) { res.status(511).json(`Erro ao listar PGDs &&&`) }
    } else {
      if(tipo == "RADA")
        try { pgds = await PGD.listarRADA() }
        catch(e) { res.status(512).json(`Erro ao listar RADAs &&&`) }
    }
  }

  if(tipo == "PGD" || tipo == "PGD_LC") {
    var idPGD = pgds.find(x => x.numero == numDiploma).idPGD;
    try { myPGD = await PGD.consultar(idPGD) }
    catch(e) { res.status(513).json(`Erro a consultar PGD &&&`) }
    codigos = myPGD.map(classe => classe.codigo);
    if(tipo == "PGD")
      referencias = myPGD.map(classe => classe.referencia);
  }
  else
    if(tipo == "RADA") {
      var idPGD = pgds.find(x => x.numero == numDiploma).idRADA;
      try { myPGD = await PGD.consultarRADA(idPGD) }
      catch(e) { res.status(514).json(`Erro a consultar RADA &&&`) }
      codigos = myPGD.map(classe => classe.codigo);
      referencias = myPGD.map(classe => classe.referencia);
    }
  //####################################################################

    var tempoAtual = new Date()
    var anoAtual = tempoAtual.getFullYear()
    var anoRegEx = /\d\d\d\d/
    
    var codsFicheiroClasses = []
    var refsFicheiroClasses = []
    var codref = 1 // 0 = sem cod/ref válidos || 1 = cod válido || 2 = ref válida

    var mensagens = []
    var mensagensAnt = req.doc.mensagens
    var classes = req.doc.classes

    for(var i=0; i < classes.length; i++){
      // Ignora linhas vazias
      if(classes[i].codigo || classes[i].referencia || classes[i].dataInicio || classes[i].dataFim || classes[i].numAgregacoes || classes[i].medicaoPapel || classes[i].medicaoDigital || classes[i].medicaoOutro ) {
        
        // 2 - codigo (I)
        if(tipo != "PGD" && tipo != "RADA"){
          if(classes[i].codigo == ''){ // Campo vazio
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna codigo é obrigatório, sempre que existir código de classificação na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
            codref = 0
          }
          else {
            if(!codigos.includes(classes[i].codigo)) { // Campo mal preenchido
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. Os campos da coluna codigo devem ser preenchidos com os valores do código de classificação existentes na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
              codref = 0
            }
            else 
              codsFicheiroClasses.push(classes[i].codigo)
          }
        }
        else { 
          // 3 - referencia 
          if(classes[i].referencia != ''){ // referencia preenchida
            if(!referencias.includes(classes[i].referencia)){ // referencia preenchida inválida
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. Os campos da coluna referencia devem ser preenchidos com os valores do número de referência existentes na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
              codref = 0
            }
            else{ // referencia preenchida válida
              refsFicheiroClasses.push(classes[i].referencia)
              codref = 2
            }
          } 
          // 2 - codigo (II)
          else{ // referencia não preenchida -> vamos verificar codigo
            if(classes[i].codigo != ''){ // codigo preenchido
              if(!codigos.includes(classes[i].codigo)){ // codigo preenchido inválido
                mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna codigo é obrigatório, sempre que existir código de classificação na respetiva tabela. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
                codref = 0
              }
            else{ // codigo preenchido válido
                codsFicheiroClasses.push(classes[i].codigo)
                codref = 1
              }
            }
            else{ //ambos campos vazios
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. Os campos da coluna codigo e da coluna referencia não pode estar ambos vazios. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
              codref = 0
            }
          }
        }

        // 4 - dataInicial
        if(classes[i].dataInicio == '') // Campo vazio
          mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataInicial é obrigatório. Deve preenchê-lo com o ano inicial da documentação proposta para eliminação, no formato AAAA. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
        else{
          if(!anoRegEx.test(classes[i].dataInicio) || (classes[i].dataInicio.length != 4))  // Campo mal preenchido : formato de data errado
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataInicial é obrigatório. Deve preenchê-lo com o ano inicial da documentação proposta para eliminação, no formato AAAA. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
          else
            if(Number(anoAtual) - Number(classes[i].dataInicio) > 100) //Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataInicial é obrigatório. A diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
        }

        // 5 - dataFinal
        if(classes[i].dataFim == '') // Campo vazio
          mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataFinal é obrigatório. Deve preenchê-lo com o ano final da documentação proposta para eliminação, no formato AAAA. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
        else{
          if(!anoRegEx.test(classes[i].dataFim) || (classes[i].dataFim.length != 4)) // Campo mal preenchido : formato de data errado
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataFinal é obrigatório. Deve preenchê-lo com o ano final da documentação proposta para eliminação, no formato AAAA. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
          else{
            if(Number(anoAtual) - Number(classes[i].dataFim) > 100) //Campo mal preenchido: diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna dataFinal é obrigatório. A diferença entre o ano corrente e o valor introduzido não pode ser superior a 100 anos. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");   
            else 
              if(classes[i].dataInicio != '' && Number(classes[i].dataFim) < Number(classes[i].dataInicio)) // Campo mal preenchido: ano final inferior ao ano inicial + ano inicial superior ao ano final
                mensagens.push("Não foi possível importar o ficheiro de classes / séries. O valor introduzido nos campos da coluna dataInicial (ano inicial da documentação proposta para eliminação) não pode ser superior ao valor introduzido no campo dataFinal (data final da documentação proposta para eliminação). Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
          }
        }

        // 6 - numAgregacoes
        if(classes[i].agregacoes.length == 0) {// Só verificamos caso não se tenha submitido um ficheiro de agregações.
          if(classes[i].numAgregacoes == '') // Campo vazio
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. O preenchimento dos campos da coluna numAgregacoes é obrigatório, se não submeter um ficheiro com a identificação das agregações / unidades de instalação. Deve preenchê-lo com o número de agregações / unidades de instalação por classe / série, que pretende eliminar. Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
          else
            if(!(/^(0|([1-9]\d*))$/.test(classes[i].numAgregacoes))) // Campo mal preenchido: outros formatos de números
              mensagens.push("Não foi possível importar o ficheiro de classes / séries. Deve preencher os campos da coluna numAgregacoes (número de agregações / unidades de instalação por classe / série) com um número natural (Ex: 234). Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
        }
        else{
          classes[i].numAgregacoes = classes[i].agregacoes.length
          req.doc.classes = classes
        }
        
        // 7 - medicaoPapel / medicaoDigital / medicaoOutro
        if(classes[i].medicaoPapel == '' && classes[i].medicaoDigital == '' && classes[i].medicaoOutro == '') // Os 3 campos da medicação vazios
          mensagens.push("Não foi possível importar o ficheiro de classes / séries. Pelo menos um dos três campos das colunas relativas à medição devem ser preenchidos. Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
        else{
          if(classes[i].medicaoPapel != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoPapel))) //Campo mal preenchido: outros formatos de números
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. Deve preencher o campo da coluna medicaoPapel com o número de metros lineares da informação a eliminar. Pode utilizar um número natural ou decimal. Neste último caso utilize a vírgula como separador (Ex: 9876 ou 123,4546). Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
          if(classes[i].medicaoDigital != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoDigital))) //Campo mal preenchido: outros formatos de números
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. Deve preencher o campo da coluna medicaoDigital com o número de gigabites da informação a eliminar. Pode utilizar um número natural ou decimal. Neste último caso utilize a vírgula como separador (Ex: 9876 ou 123,4546). Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
          if(classes[i].medicaoOutro != '' && !(/^[0-9]*,?[0-9]*$/.test(classes[i].medicaoOutro))) //Campo mal preenchido: outros formatos de números
            mensagens.push("Não foi possível importar o ficheiro de classes / séries. Deve preencher o campo da coluna medicaoOutro com o valor da unidade de medida do suporte a eliminar. Pode utilizar um número natural ou decimal. Neste último caso utilize a vírgula como separador (Ex: 9876 ou 123,4546). Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
        }

        // 8 - dono
        if(tipo != "PGD" && tipo != "RADA"){ 
          if(codref == 1) { // (evitar fazer a verificação seguinte caso o código não seja inválido)
            var a = myPGD.filter(c => c.codigo == classes[i].codigo)
            if(a.length > 0) {
              if(a[0].df == "C") { // Só verificamos caso o destino final seja Conservação
                if(classes[i].dono == '') // Campo vazio
                  mensagens.push("(Erro: Dono1) Não foi possível importar o ficheiro de classes / séries. O preenchimento do campo dono é obrigatório nas classes/séries de conservação. Deve preencher o campo da coluna dono com o(s) nome da(s) entidade(s) dona(s) do processo que consta(m) no catálogo de entidades da CLAV. Se o(s) nome(s) da(s) entidade(s) não constar(em) tem de propor a sua inclusão. Se for mais de uma entidade, deve separá-las com #. Verifique o seu preenchimento na seguinte linha: " + (i+2) + " %%%");
                else{
                  var ents = classes[i].dono.split("#") 
                  for(var j=0; j < ents.length - 1; j++){
                    var resu = State.getEntidade("ent_" + ents[j]) // Entidade
                    if(!resu){ 
                      var resu = State.getTipologia("tip_" + ents[j]) // Tipologia
                      if(!resu) //Campo mal preenchido: valores que não constam no campo Designação do catálogo de entidades da CLAV
                        mensagens.push("(Erro: Dono2) Não foi possível importar o ficheiro de classes / séries. O preenchimento do campo dono é obrigatório nas classes/séries de conservação. Deve preencher o campo da coluna dono com o(s) nome da(s) entidade(s) dona(s) do processo que consta(m) no catálogo de entidades da CLAV. Se o(s) nome(s) da(s) entidade(s)não constar(em) tem de propor a sua inclusão. Se for mais de uma entidade, deve separá-las com #. Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
                    } 
                  }
                }
              }
            }
            else 
              mensagens.push("(Erro: Dono3) Não foi possível importar o ficheiro de classes / séries. Não foi possível verificar o(s) dono(s) porque o codigo fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
          }
          else 
            mensagens.push("(Erro: Dono4) Não foi possível importar o ficheiro de classes / séries. Não foi possível verificar o(s) dono(s) porque o codigo fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (i+2) + " %%%");
        }
      }
      codref = 1 //reset

      var agregacoes = classes[i].agregacoes
      var codsagreg = []

      for(var j=0; j < agregacoes.length; j++){

        // Ignora linhas vazias
        if(agregacoes[j].codigo || agregacoes[j].referencia || agregacoes[j].codigoAgregacao || agregacoes[j].titulo || agregacoes[j].dataContagem || agregacoes[j].ni) {
          
          codref = 1
          if(tipo == "PGD" || tipo == "RADA")
            if(agregacoes[j].referencia == classes[i].referencia)
              codref = 2

          // 4 - codigoAgregacao
          if(agregacoes[j].codigoAgregacao == '') // Campo vazio
            mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna codigoAgregacao é obrigatório e deve ser preenchido com o código da agregação / unidade de instalação a eliminar. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");
          else{
            if(codsagreg.length == 0) // (primeiro código)
              codsagreg[0] = agregacoes[j].codigoAgregacao
            else
              if(codsagreg.includes(agregacoes[j].codigoAgregacao)) //Campo mal preenchido: agregações com o mesmo código da agregação / UI na mesma classe / série
                mensagens.push("Não foi possível importar o ficheiro de agregações. Na mesma classe/série não podem existir agregações com o mesmo codigoAgregacao. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");
              else 
                codsagreg.push(agregacoes[j].codigoAgregacao)
          }

          // 5 - titulo
          if(agregacoes[j].titulo == '') // Campo vazio
            mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna titulo é obrigatório e deve ser preenchido com o título da agregação / unidade de instalação a eliminar. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");

          // 6 - dataInicioContagemPCA
          if(agregacoes[j].dataContagem == '') // Campo vazio
            mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna dataInicioContagemPCA é obrigatório e deve ser preenchido com a data de início de contagem do prazo de conservação administrativo (PCA). O valor introduzido deve ser igual ou inferior à subtração do valor existente no campo PCA da respetiva classe / série ao ano corrente, mais um ano. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");
          else{
            if(!anoRegEx.test(agregacoes[j].dataContagem)) // Campo mal preenchido : formato de data errado
              mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna dataInicioContagemPCA é obrigatório e deve ser preenchido com a data de início de contagem do prazo de conservação administrativo (PCA), no formato AAAA. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");
            else {
              var a = []
              if(codref == 1) { // codigo
                a = myPGD.filter(c => c.codigo == agregacoes[j].codigo)
                if(a.length > 0) {
                  if(Number(agregacoes[j].dataContagem) > (Number(anoAtual) - Number(a[0].pca) + 1))  // Campo mal preenchido
                    mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna dataInicioContagemPCA é obrigatório e deve ser preenchido com a data de início de contagem do prazo de conservação administrativo (PCA). O valor introduzido deve ser igual ou inferior à subtração do valor existente no campo PCA da respetiva classe / série ao ano corrente, mais um ano. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");     
                } else {
                  mensagens.push("Não foi possível importar o ficheiro de agregações. Não foi possível verificar a data de início de contagem porque a referencia e/ou o codigoClasse fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");
                }
              } else if(codref == 2) { // referencia
                a = myPGD.filter(c => c.referencia == agregacoes[j].referencia)
                if(a.length > 0) {
                  if(Number(agregacoes[j].dataContagem) > (Number(anoAtual) - Number(a[0].pca) + 1)) // Campo mal preenchido
                    mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna dataInicioContagemPCA é obrigatório e deve ser preenchido com a data de início de contagem do prazo de conservação administrativo (PCA). O valor introduzido deve ser igual ou inferior à subtração do valor existente no campo PCA da respetiva classe / série ao ano corrente, mais um ano. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");     
                } else {
                  mensagens.push("Não foi possível importar o ficheiro de agregações. Não foi possível verificar a data de início de contagem porque a referencia e/ou o codigoClasse fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");
                }
              }
              else
                mensagens.push("Não foi possível importar o ficheiro de agregações. Não foi possível verificar a data de início de contagem porque a referencia e/ou o codigoClasse fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");
            }
          }

          // 7 - intervencao
          if(tipo != "PGD" && tipo != "RADA"){
            if(codref == 1) {
              var a = myPGD.filter(c => c.codigo == agregacoes[j].codigo)
              if(a.length > 0) {
                if(a[0].df == "E") { // Só verificamos caso o destino final seja Eliminação
                  if(agregacoes[j].ni == '') // Campo vazio em classes / séries de eliminação
                    mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna intervencao (natureza de intervenção) é obrigatório nas agregações das classes / séries de eliminação. Deve preenchê-lo com um dos valores: Dono ou Participante. Verifique o seu preenchimento na seguinte linha: " + (j+2) + " %%%");
                  else
                    //Campo mal preenchido: com outros valores que não Dono ou Participante.
                    if( !/participante/i.test(agregacoes[j].ni) && !/dono/i.test(agregacoes[j].ni) ) 
                      mensagens.push("Não foi possível importar o ficheiro de agregações. O preenchimento dos campos da coluna intervencao (natureza de intervenção) é obrigatório nas agregações das classes / séries de eliminação. Deve preenchê-lo com um dos valores: Dono ou Participante. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");   
                }
              } 
              else
                mensagens.push("Não foi possível importar o ficheiro de agregações. Não foi possível verificar a natureza de intervencao porque o codigoClasseAA fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");
            }
            else 
              mensagens.push("Não foi possível importar o ficheiro de agregações. Não foi possível verificar a natureza de intervencao porque o codigoClasseBBB fornecido é inválido. Verifique o seu preenchimento na seguinte linha: "+ (j+2) + " %%%");
          }
        } 
        codref = 1 //reset depois do ciclo
      }
    }

    for(var e=0; e < mensagensAnt.length; e++)
      mensagens.push(mensagensAnt[e])

    if(mensagens.length > 0) {
      res.status(515).jsonp(
        {
          mensagem: "Erro(s) na análise semântica do(s) ficheiro(s) CSV:",
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
        res.status(500).json({
          mensagem: "E500 - Erro na consulta de utilizador para importação do AE:",
          erros: erro
        });
      else {
        AutosEliminacao.importar(req.doc, req.query.tipo, user)
          .then((dados) => {
            res.status(201).jsonp({
              tipo: dados.tipo,
              codigoPedido: dados.codigo,
              mensagem: "Auto de Eliminação importado com sucesso e adicionado aos pedidos com codigo: " + dados.codigo,
              ae: req.doc
            });
          })
          .catch((erro) => res.status(501).jsonp({
                              mensagem: "E501 - Erro na criação do pedido de importação do AE:",
                              erros: erro
                            }));
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
  (req, res) => {
    User.getUserById(req.user.id, function (err, user) {
      if (err)
        res.status(500).json(`Erro na consulta de utilizador para importação do AE: ${err}`);
      else {
              AutosEliminacao.importar(req.doc, req.query.tipo, user)
                .then((dados) => {
                  res.status(201).jsonp({
                    tipo: dados.tipo,
                    codigoPedido: dados.codigo,
                    mensagem: "Auto de Eliminação importado com sucesso e adicionado aos pedidos com codigo: " + dados.codigo,
                    ae: req.doc
                  });
                })
                .catch((erro) => res.status(500).json(`Erro na criação do pedido de importação do AE: ${erro}`));
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
