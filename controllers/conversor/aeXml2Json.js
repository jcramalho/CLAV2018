var Classe = require("../api/classes")

var aePGF_LC = function(obj,tipo) {
  return new Promise(async function(resolve, reject) {
    var currentTime = new Date();

    var err = []
    
    if(tipo==="PGD_LC")
      var legislacao = "Portaria "+obj.portaria[0]
    else var legislacao = obj.legislacao[0]
    var auto = {
      tipo: tipo,
      fundo: [],
      legislacao: legislacao,
      zonaControlo: []
    }

    for(let f of obj.fundo)
      auto.fundo.push("ent_"+f)
    
    for(let zc of obj.zonaControlo) {
      var zona = {}
      if(tipo==="PGD_LC") {
        var res = await Classe.retrieve("c"+zc.codigo)
        if(!res.codigo) reject(new Error("Classe "+zc.codigo+" não encontrada"))

        zona.titulo = res.titulo
        zona.prazoConservacao = res.pca.valores
        zona.destino = res.df.valor
        var conservacao = res.pca.valores        
      }
      else {
        zona.titulo = zc.titulo[0]
        zona.prazoConservacao = zc.prazoConservacao[0]
        zona.destino = zc.destino[0] 
        var conservacao = zc.prazoConservacao[0] 
      }

      zona.codigo = zc.codigo[0]
      zona.dataInicio = zc.dataInicio[0]
      zona.dataFim = zc.dataFim[0]

      if(zc.medicaoPapel) zona.uiPapel = zc.medicaoPapel[0]
      if(zc.medicaoDigital) zona.uiDigital = zc.medicaoDigital[0]
      if(zc.medicaoOutros) zona.uiOutros = zc.medicaoOutros[0]
      zona.agregacoes = []
      
      for(let ag of zc.agregacao) {
        //Invariante da data de Conservacao
        var dataContagem = ag.dataContagem;
        var inv = parseInt(conservacao) + parseInt(dataContagem);
        var inv2 = parseInt(dataContagem) - parseInt(zc.dataInicio[0])
        if (inv < currentTime.getFullYear() && inv2>=0) {
          zona.agregacoes.push({
            codigo: ag.codigo[0],
            titulo: ag.titulo[0],
            dataContagem: ag.dataContagem[0],
            ni: ag.ni[0]
          });
        } else {
          err.push({
            codigo: zc.codigo[0],
            agregacao: ag.codigo[0]
          });
        }
      }
      auto.zonaControlo.push(zona)
        
    }

    resolve({auto: auto, error: err});
  })
}

module.exports = aePGF_LC;