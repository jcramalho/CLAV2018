const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require('../../controllers/api/utils').normalize

const RADA = module.exports;

RADA.criar = async rada => {
  const query = `INSERT DATA {${rada}}`;
  const ask = `ASK {${rada}}`;

  return execQuery("update", query).then(res =>
    execQuery("query", ask).then(result => {
      if (result.boolean) return "Sucesso na inserção do RADA";
      else throw "Insucesso na inserção do RADA";
    })
  );
};

RADA.listar = async () => {
  let query = `select ?titulo ?codigo ?dataAprovacao where { 
    ?s rdf:type clav:RADA;
      clav:codigo ?codigo;
      clav:titulo ?titulo;
      clav:dataAprovacao ?dataAprovacao.
  }`
  try {
    let result = await execQuery("query", query);
    let radas = normalize(result);

    for (let i = 0; i < radas.length; i++) {
      let query2 = `select ?sigla ?designacao where { 
        clav:rada_${radas[i].codigo} rdf:type clav:RADA;
              clav:eDaResponsabilidadeDe ?entidade.
              
         ?entidade clav:entSigla ?sigla;
                  clav:entDesignacao ?designacao.
      }`

      let result_ent_resp = await execQuery("query", query2);
      radas[i]["entResp"] = normalize(result_ent_resp);
    }

    return radas;

  }
  catch (erro) { throw (erro); }
};

RADA.consulta = async id => {
  let query_rada = `select * where { 
    clav:rada_${id} rdf:type clav:RADA;
      clav:codigo ?codigo;
      clav:titulo ?titulo;
      clav:dataAprovacao ?dataAprovacao;
      clav:dataRevogacao ?dataRevogacao;
      clav:aprovadoPorLeg ?despachoAprovacao;
      clav:contemRE ?re;
      clav:contemTS ?ts.

      ?despachoAprovacao clav:diplomaSumario ?despachoSumario;
                clav:diplomaNumero ?despachoNumero.
    
      ?re clav:dataInicial ?dataInicial;
          clav:dataFinal ?dataFinal;
          clav:estadoConservacao ?est_conser ;
          clav:histAdministrativa ?hist_admin ;
          clav:histCustodial ?hist_cust ;
          clav:localizacao ?localizacao ;
          clav:medicaoUIsDigital ?medicaoUI_digital ;
          clav:medicaoUIsOutros ?medicaoUI_outros ;
          clav:medicaoUIsPapel ?medicaoUI_papel ;
          clav:numeroSeries ?nSeries ;
          clav:numeroSubseries ?nSubseries ;
          clav:numeroUIs ?nUI ;
          clav:sistOrganizacao ?sist_org .
          
      ?ts clav:titulo ?tituloTS.
  }`

  let query_ent_responsaveis = `select ?sigla ?designacao where { 
    clav:rada_${id} rdf:type clav:RADA;
          clav:eDaResponsabilidadeDe ?entidade.
          
     ?entidade clav:entSigla ?sigla;
              clav:entDesignacao ?designacao.
  }`

  let query_produtoras = `select ?ent_or_tip ?sigla ?designacao where {
    clav:rada_${id}_re clav:avaliaDocProduzidaPor ?ent_or_tip.
     
    {
       ?ent_or_tip rdf:type clav:Entidade; 
            clav:entSigla ?sigla;
            clav:entDesignacao ?designacao .
    } UNION  {
        ?ent_or_tip rdf:type clav:TipologiaEntidade; 
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao .
    }
  }`

  let query_classes = `select * where { 
    clav:rada_${id}_ts clav:temClasse ?classes.
     
    {
       ?classes rdf:type clav:Serie; 
                clav:codigo ?codigo;
            	  clav:titulo ?titulo;
              	clav:descricao ?descricao;
                clav:dataInicial ?dataInicial ;
                clav:dataFinal ?dataFinal;
                clav:tipoUA ?tipoUA ;
                clav:tipoSerie ?tipoSerie ;
                clav:localizacao ?localizacao ;
                clav:temPai ?pai.
          		  
        OPTIONAL { ?classes clav:temPCA ?pca }
        OPTIONAL { ?classes clav:temDF ?df }
    
      } UNION  {
        ?classes rdf:type clav:Subserie; 
                clav:codigo ?codigo;
            		clav:titulo ?titulo;
              	clav:descricao ?descricao;
                clav:dataInicial ?dataInicial ;
                clav:dataFinal ?dataFinal;
                clav:temPai ?pai;
                clav:temPCA ?pca;
                clav:temDF ?df.

    } UNION {
        ?classes rdf:type clav:Area_Organico; 
                clav:codigo ?codigo;
            		clav:titulo ?titulo;
                clav:descricao ?descricao;
                clav:nivel ?nivel.
                	
        OPTIONAL { ?classes clav:temPai ?pai. }
    }
  }`

  try {
    let result = await execQuery("query", query_rada);
    let rada = normalize(result);

    rada = rada[0];

    let result_ent_resp = await execQuery("query", query_ent_responsaveis);
    rada["entResp"] = normalize(result_ent_resp);

    let result_produtoras = await execQuery("query", query_produtoras);
    rada["produtoras"] = normalize(result_produtoras);

    let result_classes = await execQuery("query", query_classes);
    rada["tsRada"] = normalize(result_classes);

    for (let i = 0; i < rada.tsRada.length; i++) {
      if (!!rada.tsRada[i].tipoSerie) {
        // SUPORTE E MEDICAO
        let query_suporte_medicao = `select ?suporte ?medicao where {
          clav:rada_${rada.codigo}_serie_${rada.tsRada[i].codigo} clav:temSuporteMedicao ?suporte_e_medicao.
            
            ?suporte_e_medicao clav:medicao ?medicao;
                               clav:suporte ?suporte.
        }`

        let result_suporte_medicao  = await execQuery("query", query_suporte_medicao);
        rada.tsRada[i]["suporte_e_medicao"] = normalize(result_suporte_medicao);
        
        // QUERY PARA IR BUSCAR AS ENTIDADES PRODUTORAS DA SERIE
        let query_produtoras_serie = `select ?ent_or_tip ?sigla ?designacao where {

          clav:rada_${rada.codigo}_serie_${rada.tsRada[i].codigo} clav:produzidaPor ?ent_or_tip.
           
          {
             ?ent_or_tip rdf:type clav:Entidade; 
                  clav:entSigla ?sigla;
                  clav:entDesignacao ?designacao .
          } UNION  {
              ?ent_or_tip rdf:type clav:TipologiaEntidade; 
                  clav:tipSigla ?sigla;
                  clav:tipDesignacao ?designacao .
          }
        }`
        let result_produtoras_serie = await execQuery("query", query_produtoras_serie);
        rada.tsRada[i]["produtoras"] = normalize(result_produtoras_serie);

        // QUERY PARA IR BUSCAR A LEGISLACAO DA SERIE
        let query_legislacao_serie = `select * where {
            
          clav:rada_${rada.codigo}_serie_${rada.tsRada[i].codigo} clav:reguladaPor ?leg.
           
          ?leg clav:diplomaTipo ?tipo;
            clav:diplomaNumero ?numero;
            clav:diplomaData ?data;
            clav:diplomaSumario ?sumario.
        }`

        let result_legislacao_serie = await execQuery("query", query_legislacao_serie);
        rada.tsRada[i]["legislacao"] = normalize(result_legislacao_serie);
      }

      if (!!rada.tsRada[i].dataInicial) {
        let query_ui = `select ?codigo ?titulo where {
          clav:${rada.tsRada[i].classes.split('#')[1]} clav:ePaiDeUI ?UIs.
          
          ?UIs clav:codigo ?codigo;
               clav:titulo ?titulo.
        }`

        let result_uis = await execQuery("query", query_ui);
        rada.tsRada[i]["UIs"] = normalize(result_uis);

        let query_relacoes = `select ?id ?codigo ?titulo ?rel WHERE{
          clav:${rada.tsRada[i].classes.split('#')[1]} clav:temRelProc ?id;
                      ?tipoRel ?id.
      
          ?id clav:codigo ?codigo;
              clav:titulo ?titulo.
      
          filter (?tipoRel!=clav:temRelProc) .
          BIND (STRAFTER(STR(?tipoRel), 'clav#') AS ?rel).
        } Order by ?idRel ?codigo`

        let result_relacoes = await execQuery("query", query_relacoes);
        rada.tsRada[i]["relacoes"] = normalize(result_relacoes);

      }
      if (!!rada.tsRada[i].pca && !!rada.tsRada[i].df) {
        // QUERIES PARA O DF
        query_df = `select * WHERE{
                        clav:df_${rada.tsRada[i].classes.split('#')[1]} clav:dfValor ?df.
                                                        
                        OPTIONAL{ clav:df_${rada.tsRada[i].classes.split('#')[1]} clav:dfNota ?notadf }
                        OPTIONAL{ clav:df_${rada.tsRada[i].classes.split('#')[1]} clav:temJustificacao ?justificacaoDF }
                  }`
        let result_df = await execQuery("query", query_df);
        rada.tsRada[i]["df"] = normalize(result_df);

        rada.tsRada[i]["df"] = rada.tsRada[i]["df"][0]

        query_df_justificacao = `select ?criterio ?tipo ?conteudo WHERE{
              clav:just_df_${rada.tsRada[i].classes.split('#')[1]} clav:temCriterio ?criterio.
              
              ?criterio rdf:type ?tipoCriterio ;
                        clav:conteudo ?conteudo.
        
              VALUES ?tipoCriterio { clav:CriterioJustificacaoLegal clav:CriterioJustificacaoComplementaridadeInfo clav:CriterioJustificacaoDensidadeInfo }
              BIND (STRAFTER(STR(?tipoCriterio), 'clav#') AS ?tipo).
        }`

        let result_df_justificacao = await execQuery("query", query_df_justificacao);
        rada.tsRada[i]["df"]["justificacaoDF"] = normalize(result_df_justificacao);

        for (let j = 0; j < rada.tsRada[i].df.justificacaoDF.length; j++) {
          if (rada.tsRada[i].df.justificacaoDF[j].tipo == "CriterioJustificacaoLegal") {
            let query_df_criterio_legal = `select * WHERE{
              clav:${rada.tsRada[i].df.justificacaoDF[j].criterio.split('#')[1]} clav:criTemLegAssoc ?legislacao.
             
             ?legislacao clav:diplomaTipo ?tipo;
                     clav:diplomaNumero ?numero;
                     clav:diplomaData ?data;
                     clav:diplomaSumario ?sumario.
            }`

            let result_df_criterio_legal = await execQuery("query", query_df_criterio_legal);
            rada.tsRada[i].df.justificacaoDF[j]["relacoes"] = normalize(result_df_criterio_legal);
          } else {
            let query_df_criterio_outros = `select ?codigo ?titulo WHERE{
              clav:${rada.tsRada[i].df.justificacaoDF[j].criterio.split('#')[1]} clav:critTemProcRel ?classes.
             
             ?classes clav:codigo ?codigo;
                      clav:titulo ?titulo.
             }`

            let result_df_criterio_outros = await execQuery("query", query_df_criterio_outros);
            rada.tsRada[i].df.justificacaoDF[j]["relacoes"] = normalize(result_df_criterio_outros);
          }

        }
        //QUERIES PCA
        query_pca = `select * WHERE{
          clav:pca_${rada.tsRada[i].classes.split('#')[1]} clav:pcaValor ?pca;
                                                          clav:pcaFormaContagemNormalizada ?formaContagem.
          
          ?formaContagem skos:prefLabel ?formaLabel.
          
          OPTIONAL{ clav:pca_${rada.tsRada[i].classes.split('#')[1]} clav:pcaSubformaContagem ?subformaContagem.
                      ?subformaContagem skos:scopeNote ?subformaLabel.	 
          }
          OPTIONAL{ clav:pca_${rada.tsRada[i].classes.split('#')[1]} clav:pcaSubformaContagemNaoNormalizada ?subformaLabel }
          OPTIONAL{ clav:pca_${rada.tsRada[i].classes.split('#')[1]} clav:pcaNota ?notaPCA }
          OPTIONAL{ clav:pca_${rada.tsRada[i].classes.split('#')[1]} clav:temJustificacao ?justificacaoPCA }
        }`
        let result_pca = await execQuery("query", query_pca);
        rada.tsRada[i]["pca"] = normalize(result_pca);

        rada.tsRada[i]["pca"] = rada.tsRada[i]["pca"][0]

        query_pca_justificacao = `select ?criterio ?tipo ?conteudo WHERE{
            clav:just_pca_${rada.tsRada[i].classes.split('#')[1]} clav:temCriterio ?criterio.

            ?criterio rdf:type ?tipoCriterio ;
                clav:conteudo ?conteudo.

            VALUES ?tipoCriterio { clav:CriterioJustificacaoLegal clav:CriterioJustificacaoGestionario clav:CriterioJustificacaoUtilidadeAdministrativa }
            BIND (STRAFTER(STR(?tipoCriterio), 'clav#') AS ?tipo).
        }`

        let result_pca_justificacao = await execQuery("query", query_pca_justificacao);
        rada.tsRada[i]["pca"]["justificacaoPCA"] = normalize(result_pca_justificacao);

        for (let j = 0; j < rada.tsRada[i].pca.justificacaoPCA.length; j++) {
          if (rada.tsRada[i].pca.justificacaoPCA[j].tipo == "CriterioJustificacaoLegal") {
            let query_pca_criterio_legal = `select * WHERE{
                  clav:${rada.tsRada[i].pca.justificacaoPCA[j].criterio.split('#')[1]} clav:criTemLegAssoc ?legislacao.

                      ?legislacao clav:diplomaTipo ?tipo;
                            clav:diplomaNumero ?numero;
                            clav:diplomaData ?data;
                            clav:diplomaSumario ?sumario.
              }`

            let result_pca_criterio_legal = await execQuery("query", query_pca_criterio_legal);
            rada.tsRada[i].pca.justificacaoPCA[j]["relacoes"] = normalize(result_pca_criterio_legal);
          } else {
            if (rada.tsRada[i].pca.justificacaoPCA[j].tipo == "CriterioJustificacaoUtilidadeAdministrativa") {
              let query_pca_criterio_outros = `select ?codigo ?titulo WHERE{
                clav:${rada.tsRada[i].pca.justificacaoPCA[j].criterio.split('#')[1]} clav:critTemProcRel ?classes.

                      ?classes clav:codigo ?codigo;
                      clav:titulo ?titulo.
            }`

              let result_pca_criterio_outros = await execQuery("query", query_pca_criterio_outros);
              rada.tsRada[i].pca.justificacaoPCA[j]["relacoes"] = normalize(result_pca_criterio_outros);
            }
          }
        }
      }
    }

    return rada;
  }
  catch (erro) { throw (erro); }
}; 