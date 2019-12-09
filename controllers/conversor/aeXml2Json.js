var Classe = require("../api/classes")

var aePGF_LC = function(obj) {
  return new Promise(async function(resolve, reject) {
    var currentTime = new Date();

    var err = []
    
    var auto = {
      tipo: "PGD_LC",
      fundo: [],
      legislacao: "Portaria "+obj.portaria[0],
      zonaControlo: []
    }

    for(let f of obj.fundo)
      auto.fundo.push("ent_"+f)
    
    for(let zc of obj.zonaControlo) {
      var zona = {}
      var res = await Classe.retrieve("c"+zc.codigo)
      if(!res.codigo) reject(new Error("Classe "+zc.codigo+" não encontrada"))
      else {
        zona.codigo = zc.codigo[0]
        zona.titulo = res.titulo
        zona.prazoConservacao = res.pca.valores
        zona.destino = res.df.valor
        zona.dataInicio = zc.dataInicio[0]
        zona.dataFim = zc.dataFim[0]

        if(zc.medicaoPapel) zona.uiPapel = zc.medicaoPapel[0]
        if(zc.medicaoDigital) zona.uiDigital = zc.medicaoDigital[0]
        if(zc.medicaoOutros) zona.uiOutros = zc.medicaoOutros[0]
        zona.agregacoes = []
        var conservacao = res.pca.valores
        for(let ag of zc.agregacao) {
          //Invariante da data de Conservacao
          var dataContagem = ag.dataContagem;
          var inv = parseInt(conservacao) + parseInt(dataContagem);
          if (inv < currentTime.getFullYear()) {
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
    }

    resolve({auto: auto, error: err});
  })
}

module.exports = aePGF_LC;