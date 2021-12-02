var State = require('../state')
import { customAlphabet } from 'nanoid'

var aeConverter = function(obj,tipo) {
  return new Promise(async function(resolve, reject) {

    // Construção do objeto interno
    var myAuto = {}
    // identificador do AE
    const nanoid = customAlphabet('1234567890abcdef', 10)
    myAuto.id = "ae_" + nanoid()
    myAuto.data = new Date().toISOString().substr(0,10)
    // tipo: AE_...
    var myTipo = obj["autoEliminação"]["fonteLegitimação"]["tipo"]
    myAuto.tipo = 'AE_' + myTipo
    // legislacao
    var myDiploma = obj["autoEliminação"]["fonteLegitimação"]["diploma"]
    myAuto.legislacao = myTipo + " " + myDiploma
    // id da legislação na BD: vou buscar à cache
    var legIdent = myDiploma.split(' ')
    var leg = State.getLegislacaoByTipoNumero(legIdent[0], legIdent[1])
    myAuto.refLegislacao = leg.id
    // Fundos
    // vou à cache buscar a info das entidades a partir da sigla
    var myFundos = obj["autoEliminação"]["fundos"].map(f => { 
        let ent = State.getEntidade('ent_' + f.fundo[0])
        return ent
    })
    myAuto.fundo = myFundos.map(e => {return {
        fundo: e.id,
        nome: e.designacao
    }})
    
    var classes = obj["autoEliminação"]["classes"].map(function(c,i) {
      let resClasse = {}
      resClasse['id'] = myAuto.id + "_classe_" + i 
      if(c.hasOwnProperty('código')) resClasse['codigo'] = c.código
      if(c.hasOwnProperty('referência')) resClasse['referencia'] = c.referência
      if(c.hasOwnProperty('naturezaIntervenção')) resClasse['ni'] = c.naturezaIntervenção
      resClasse['dataInicio'] = c.anoInício
      resClasse['dataFim'] = c.anoFim
      /*if(c.dimensãoSuporte.hasOwnProperty('papel')) resClasse['uiPapel'] = c.dimensãoSuporte[0].papel[0]
      if(c.dimensãoSuporte[0].hasOwnProperty('digital')) resClasse['uiPapel'] = c.dimensãoSuporte[0].digital[0]*/
      resClasse['nrAgregacoes'] = c['númeroAgregações']
      if(c.hasOwnProperty('agregações')) resClasse['agregacoes'] = c.agregações.map(function(a){
        return {
          codigo: a.código,
          titulo: a.título,
          dataContagem: a.ano,
          ni: a.naturezaIntervenção? a.naturezaIntervenção : null
        }
      })
      return resClasse
    })

    myAuto['zonaControlo'] = classes

    /* Carregamento das classes da TS na BD para validação
    
    switch(myTipo){
      case "PGD": var classesCompletas = await PGD.consultar("pgd_"+leg.id)
                  break
      case "RADA": var classesCompletas = await PGD.consultar("tsRada_"+leg.id)
                  break
      default: var classesCompletas = []
    }*/

    resolve({auto: myAuto, error: "Em revisão..."});
  })
}

module.exports = aeConverter;