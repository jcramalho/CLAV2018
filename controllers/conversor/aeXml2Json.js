var Classe = require("../api/classes")
var PGD = require("../api/pgd")
var Rada = require("../api/rada")
var TS = require("../api/tabsSel")
var Leg = require("../api/leg")
var State = require('../state')

var aeConverter = function(obj,tipo) {
  return new Promise(async function(resolve, reject) {
    var currentTime = new Date();

    var fonteLeg = obj['fonteLegitimação'];
    var fonteLegTipo = fonteLeg[0].tipo[0]
    var fonteLegDiploma = fonteLeg[0].diploma[0]
    console.log('FL: ' + fonteLegTipo + ', ' + fonteLegDiploma)
    var fundos = obj.fundos.map(f => { 
      State.getEntidade(f.fundo[0])
        .then(ent => { console.log('debug:' + ent); return ent})
        .catch(e => {return {error: e}})
    })
    console.log('fundos: ' + JSON.stringify(fundos))
    var classes = obj.classes[0].classe.map(function(c) {
      return {
        código: c.código[0],
        referência: c.referência[0],
        anoInício: c.anoInício[0],
        anoFim: c.anoFim[0],
        dimensãoSuporte: c.dimensãoSuporte,
        númeroAgregações: c.númeroAgregações[0],
        agregações: c.agregações[0].agregação.map(function(a){
          return {
            código: a.código[0],
            título: a.título[0],
            ano: a.ano[0],
            ni: a.naturezaIntervenção[0]
          }
        })
      }})

    console.dir('classes: ' + JSON.stringify(classes))


    // Construção do objeto interno

    var myAuto = {
      "id": "ae_A3ES_2021_1",
      "data": "2021-1-12",
      "fundo": [
        {
          "fundo": "ent_A3ES",
          "nome": "Agência de Avaliação e Acreditação do Ensino Superior"
        }
      ],
      "zonaControlo": [
        {
          "id": "zc_1_A3ES_2021_1",
          "dataInicio": "1990",
          "dataFim": "1999",
          "nrAgregacoes": "1",
          "UIpapel": "12",
          "UIdigital": "15,5",
          "UIoutros": "1",
          "referencia": "1",
          "titulo": "Avisos do Presidente do Tribunal de Contas",
          "destino": "CP",
          "pca": "10",
          "dono": [],
          "agregacoes": [
            {
              "codigo": "AS_1/1999",
              "titulo": "Audituria",
              "dataContagem": "2001",
              "ni": "dono"
            }
          ]
        }
      ],
      "legislacao": "Despacho Conjunto 340/2004",
      "refLegislacao": "leg_p3iBWgtWApjBs7H-ztrl9"
    }

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
    resolve({auto: {}, error: "Em revisão..."});
  })
}

module.exports = aeConverter;