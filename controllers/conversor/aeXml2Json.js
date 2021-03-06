var Classe = require("../api/classes")
var PGD = require("../api/pgd")
var Rada = require("../api/rada")
var TS = require("../api/tabsSel")
var Leg = require("../api/leg")
var State = require('../state')
const e = require("express")
const Contador = require('../../controllers/api/contador')

var aeConverter = function(obj,tipo) {
  return new Promise(async function(resolve, reject) {

    // Construção do objeto interno
    // número de série
    var cont = await Contador.get('ae')
    var num = cont.valor
    await Contador.incrementar('ae')
    // data do momento
    var d = new Date().toISOString().substr(0, 4)
  
    var fonteLeg = obj['fonteLegitimação'];
    var fonteLegTipo = fonteLeg[0].tipo[0]
    var fonteLegDiploma = fonteLeg[0].diploma[0]
    var legIdent = fonteLegDiploma.split(' ')
    var leg = State.getLegislacaoByTipoNumero(legIdent[0], legIdent[1])
    
    switch(fonteLegTipo){
      case "PGD": var classesCompletas = await PGD.consultar("pgd_"+leg.id)
                  break
      case "RADA": var classesCompletas = await PGD.consultar("tsRada_"+leg.id)
                  break
      default: var classesCompletas = []
    }
    
    var fundos = obj.fundos.map(f => { 
      let ent = State.getEntidade('ent_' + f.fundo[0])
      return ent
    })
    
    var classes = obj.classes[0].classe.map(function(c,i) {
      let resClasse = {}
      resClasse['id'] = "zc_" + i + '_' + 'ae' + '_' + d + '_' + num.toString()
      if(c.hasOwnProperty('código')) resClasse['codigo'] = c.código[0]
      if(c.hasOwnProperty('referência')) resClasse['referencia'] = c.referência[0]
      if(c.hasOwnProperty('naturezaIntervenção')) resClasse['ni'] = c.naturezaIntervenção[0]
      resClasse['dataInicio'] = c.anoInício[0]
      resClasse['dataFim'] = c.anoFim[0]
      if(c.dimensãoSuporte[0].hasOwnProperty('papel')) resClasse['uiPapel'] = c.dimensãoSuporte[0].papel[0]
      if(c.dimensãoSuporte[0].hasOwnProperty('digital')) resClasse['uiPapel'] = c.dimensãoSuporte[0].digital[0]
      resClasse['nrAgregacoes'] = c.númeroAgregações[0]
      if(c.hasOwnProperty('agregações')) resClasse['agregacoes'] = c.agregações[0].agregação.map(function(a){
        return {
          codigo: a.código[0],
          titulo: a.título[0],
          dataContagem: a.ano[0],
          ni: a.naturezaIntervenção? a.naturezaIntervenção[0] : null
        }
      })

      return resClasse
    })

    //console.log('classes: ' + JSON.stringify(classes))

    var myAuto = {
      id: "ae_" + fundos.map(f => f.sigla) + "_" + d + '_' + num.toString(),
      tipo: 'AE_' + fonteLegTipo, // isto é um AE
      data: d,
      fundo: fundos.map(e => {return {
        fundo: e.id,
        nome: e.designacao
      }}),
      "legislacao": fonteLegTipo + " " + fonteLegDiploma,
      "refLegislacao": leg.id
    }

    myAuto['zonaControlo'] = classes

    // console.log(JSON.stringify(myAuto))

    /*if(tipo=="TS/LC") {
      var referencial = obj.referencial[0] || ""

      var classesCompletas = await TS.consultar(referencial)
      classesCompletas = classesCompletas.classes.filter(c => c.nivel>2).map(c=> {
        return {
          idClasse: "c"+c.codigo+"_"+referencial,
          nivel: c.nivel,
          codigo: c.codigo,
          referencia: c.referencia,
          titulo: c.titulo,
          df: {valor: c.df.valor, nota: c.df.nota || ""},
          pca: {valores: c.pca.valores, notas: c.pca.nota || ""},
        }
      })
    }
    else if(tipo=="RADA/CLAV") {
      var referencial = obj.referencial[0] || ""

      var classesCompletas = await Rada.consultar(referencial)
      classesCompletas = classesCompletas.tsRada.filter(c => c.df && c.pca).map(c=> {
        return {
          idClasse: c.classes.split("#")[1],
          codigo: c.codigo,
          referencia: c.referencia,
          titulo: c.titulo,
          df: {valor: c.df.df, nota: c.df.notadf},
          pca: {valores: c.pca.pca, notas: c.pca.notaPCA}
        }
      })
    }
    else {
      var leg = await Leg.listar()
      leg = leg.filter(l => l.numero == legislacao.split(" ")[1])
      
      if(tipo=="PGD/LC") {
        var legislacao = obj.legislacao[0] || ""
        var classesCompletas = await PGD.consultar("pgd_lc_"+leg[0].id)
      }
      else if(tipo=="PGD") {
        var legislacao = obj.legislacao[0] || ""
        var classesCompletas = await PGD.consultar("pgd_"+leg[0].id)
      }
      else if(tipo=="RADA") {
        var legislacao = obj.legislacao[0] || ""
        var classesCompletas = await PGD.consultar("tsRada_"+leg[0].id)
      }
      else reject("Tipo incorreto!");

      classesCompletas = classesCompletas.tsRada.filter(c => c.nivel>2).map(c=> {
        return {
          idClasse: c.classe,
          nivel: c.nivel,
          codigo: c.codigo,
          referencia: c.referencia,
          titulo: c.titulo,
          df: {valor: c.df, nota: c.notaDF},
          pca: {valores: c.pca, notas: c.notaPCA},
        }
      })
    } 

    var err = []
    
    for(let f of obj.fundo)
      auto.fundo.push("ent_"+f)

    
    for(let zc of obj.zonaControlo) {
      var zona = {}
      
      var res = classesCompletas.filter(c => {
        if(c.codigo && c.referencia) return (c.codigo+" "+c.referencia == zc.codigo+" "+zc.referencia)
        else if(c.codigo) return (c.codigo == zc.codigo) 
        else if(c.referencia) return (c.referencia == zc.referencia) 
      })

      if(!res[0]) reject(new Error("Classe "+zc.codigo+" "+zc.referencia+" não encontrada"))
      res = res[0]
      zona.titulo = res.titulo
      zona.prazoConservacao = res.pca.valores
      zona.destino = res.df.valor
      var conservacao = res.pca.valores        

      zona.codigo = zc.codigo[0]
      zona.dataInicio = zc.dataInicio[0]
      zona.dataFim = zc.dataFim[0]

      if(zc.medicaoPapel) zona.uiPapel = zc.medicaoPapel[0]
      if(zc.medicaoDigital) zona.uiDigital = zc.medicaoDigital[0]
      if(zc.medicaoOutros) zona.uiOutros = zc.medicaoOutros[0]

      if(parseInt(zc.dataInicio[0]) < date.getFullYear()-100)
        reject("Classe "+zc.codigo+" "+zc.referencia+": Não é permitido eliminar documentação com mais de 100 anos, por favor verifique a Data de Início")
      if(parseInt(zc.dataInicio[0]) > currentTime.getFullYear() - parseInt(res.pca.valores))
        reject("Classe "+zc.codigo+" "+zc.referencia+": A Data de inicio deve ser inferior à subtração do Prazo de conservação administrativa ao ano corrente.")
      if(parseInt(zc.dataFim[0]) > currentTime.getFullYear())
        reject("Classe "+zc.codigo+" "+zc.referencia+": A Data de Fim deve ser anterior à data atual")
      if(parseInt(zc.dataInicio[0]) > parseInt(zc.dataFim[0]))
        reject("Classe "+zc.codigo+" "+zc.referencia+": A Data de Fim deve ser menor que a data de início")
      
      
      zona.agregacoes = []
      
      for(let ag of zc.agregacao) {
        //Invariante da data de Conservacao
        var dataContagem = ag.dataContagem;
        var res = parseInt(zc.prazoConservacao) + parseInt(dataContagem) + 1;
        var res2 = parseInt(dataContagem) - parseInt(zc.dataInicio);
        if (res > currentTime.getFullYear())
          reject("Classe "+zc.codigo+" "+zc.referencia+" - Agregação "+ag.codigo[0]+": A Data de inicio da contagem deve ser igual ou inferior à subtração do Prazo de conservação administrativa ao ano corrente. Para garantia de cumprimento integral do PCA é aconselhável adicionar a este valor um ano.")
        if (res2 < 0)
          reject("Classe "+zc.codigo+" "+zc.referencia+" - Agregação "+ag.codigo[0]+": A Data de Inicio de contagem da Agregação não pode ser inferior à Data de Início da Classe.")

        zona.agregacoes.push({
          codigo: ag.codigo[0],
          titulo: ag.titulo[0],
          dataContagem: ag.dataContagem[0],
          ni: ag.ni[0]
        });
        
      }
      auto.zonaControlo.push(zona)
        
    }*/

    //resolve({auto: auto, error: err});
    resolve({auto: myAuto, error: "Em revisão..."});
  })
}

module.exports = aeConverter;