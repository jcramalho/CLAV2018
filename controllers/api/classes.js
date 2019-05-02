const client = require('../../config/database').onthology
const normalize = require('../../controllers/api/utils').normalize
const Pedidos = require('../../controllers/pedidos')
const axios = require('axios')
const Classes = module.exports
const myhost = require('../../config/database').host

// Devolve a lista de classes de um determinado nível, por omissão do nível 1
Classes.listar = async nivel => {
    if (!nivel)  nivel = 1;

    var query = `
        Select
            ?id 
            ?codigo 
            ?titulo 
        Where {
            ?id rdf:type clav:Classe_N${nivel} ;
                    clav:classeStatus 'A';
                    clav:codigo ?codigo ;
                    clav:titulo ?titulo .
        } 
        Order by ?id 
    `
    try {
        let result = await client.query(query).execute();
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve a lista de classes de nível 3 que são consideradas processos comuns
Classes.listarPNsComuns = () => {
    var query = `
    Select
			?id
            ?codigo 
            ?titulo 
        Where {
            ?id clav:processoTipoVC clav:vc_processoTipo_pc  .
            ?id clav:codigo ?codigo .
            ?id clav:titulo ?titulo .
        } 
    `
    console.log(query)

    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve toda a informação de uma classe
Classes.retrieve = async id => {
    try{
        var classe = {
            // Metainformação e campos da área de Descrição
    
            nivel: 1,
            pai: {},
            codigo: "",
            titulo: "",
            descricao: "",
            filhos: [],
            notasAp: [],
            exemplosNotasAp: [],
            notasEx: [],
            termosInd: [],
    
            temSubclasses4Nivel: false,
            temSubclasses4NivelPCA: false,
            temSubclasses4NivelDF: false,
            subdivisao4Nivel01Sintetiza02: true,
    
            // Campos da área do Contexto de Avaliação
            // Tipo de processo
    
            tipoProc: "PC",
            procTrans: "N",
    
            // Donos do processo: lista de entidades
    
            donos: [],
    
            // Participantes no processo: lista de entidades
    
            participantes: [],
    
            // Processos Relacionados
    
            processosRelacionados: [],
    
            // Legislação Associada
    
            legislacao: [],
    
            // Bloco de decisão de avaliação: PCA e DF
    
            pca: {
                valor: "",
                formaContagem: "",
                subFormaContagem: "",
                justificacao: []        // j = [criterio]
            },                          // criterio = {tipo, notas, [proc], [leg]}
    
            df: {
                valor: "NE",
                notas: null,
                justificacao: []
            },
    
            // Bloco de subclasses de nível 4, caso haja desdobramento
    
            subclasses: []
        };
        
        let base = await axios.get(myhost + "/api/classes/" + id + "/meta");
        classe.nivel = base.data[0].codigo.split('.').length
        classe.codigo = base.data[0].codigo
        classe.pai.codigo = base.data[0].codigoPai
        classe.pai.titulo = base.data[0].tituloPai
        classe.titulo = base.data[0].titulo
        classe.descricao = base.data[0].desc
        classe.tipoProc = base.data[0].procTipo
        classe.procTrans = base.data[0].procTrans

        let filhos = await axios.get(myhost + "/api/classes/" + id + "/descendencia");
        if(filhos.data.length > 0){
            classe.filhos = filhos.data
            if(classe.nivel == 3) classe.temSubclasses4Nivel = true
        }
    
        let notasAp = await axios.get(myhost + "/api/classes/" + id + "/notasAp");
        classe.notasAp = notasAp.data

        let exemplosNotasAp = await axios.get(myhost + "/api/classes/" + id + "/exemplosNotasAp");
        classe.exemplosNotasAp = exemplosNotasAp.data

        let notasEx = await axios.get(myhost + "/api/classes/" + id + "/notasEx");
        classe.notasEx = notasEx.data

        let termosInd = await axios.get(myhost + "/api/classes/" + id + "/ti");
        classe.termosInd = termosInd.data

        let donos = await axios.get(myhost + "/api/classes/" + id + "/dono");
        classe.donos = donos.data

        let participantes = await axios.get(myhost + "/api/classes/" + id + "/participante");
        classe.participantes = participantes.data

        let procRel = await axios.get(myhost + "/api/classes/" + id + "/procRel");
        classe.processosRelacionados = procRel.data 

        let legislacao = await axios.get(myhost + "/api/classes/" + id + "/legislacao");
        classe.legislacao = legislacao.data

        let pca = await axios.get(myhost + "/api/classes/" + id + "/pca");
        if(pca.data.length > 0) classe.pca = pca.data[0]
    
        if(classe.pca && classe.pca.idJust){
            let just = await axios.get(myhost + "/api/classes/justificacao/" + classe.pca.idJust);
            classe.pca.justificacao = just.data
        }

        let df = await axios.get(myhost + "/api/classes/" + id + "/df");
        if(df.data.length > 0) classe.df = df.data[0]
        if(classe.df && classe.df.idJust){
            let just = await axios.get(myhost + "/api/classes/justificacao/" + classe.df.idJust);
            classe.df.justificacao = just.data
        }

        return classe
    }
    catch(erro){
        throw (erro);
    }
}

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTipo?
Classes.consultar = async id => {
    var query = `
            SELECT * WHERE { 
                clav:${id} clav:titulo ?titulo;
                    clav:codigo ?codigo;
                    clav:classeStatus ?status;
                    clav:descricao ?desc.

                OPTIONAL {
                    clav:${id} clav:temPai ?pai.
                    ?pai clav:codigo ?codigoPai;
                        clav:titulo ?tituloPai.
                } 
                
                OPTIONAL {
                    clav:${id} clav:processoTransversal ?procTrans;
                        clav:processoTipoVC ?pt.
                    ?pt skos:prefLabel ?procTipo.
                }
            }`
    let resultado = await client.query(query).execute()
    return normalize(resultado)
}

// Devolve a lista de filhos de uma classe: id, codigo, titulo
Classes.descendencia = async id => {
    try{
        var query = `
            SELECT ?id ?codigo ?titulo
            WHERE {
                ?id clav:temPai clav:${id} ;
                    clav:classeStatus 'A';
                    clav:codigo ?codigo ;
                    clav:titulo ?titulo .
            }
            ORDER BY ?codigo
            `
        let resultado = await client.query(query).execute();
        return normalize(resultado);
    }
    catch(erro){
        throw (erro);
    }
}

// Devolve a lista de notas de aplicação de uma classe: idNota, nota
Classes.notasAp = id => {
    var query = `
            SELECT * WHERE { 
                clav:${id} clav:temNotaAplicacao ?idNota.
                ?idNota clav:conteudo ?nota .
            }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a lista de exemplos de notas de aplicação de uma classe: [exemplo]
Classes.exemplosNotasAp = id => {
    var query = `
            SELECT ?idExemplo ?exemplo WHERE { 
                clav:${id} clav:temExemploNA ?idExemplo.
                ?idExemplo clav:conteudo ?exemplo.
            }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
Classes.notasEx = id => {
    var query = `
            SELECT * WHERE { 
                clav:${id} clav:temNotaExclusao ?idNota.
                ?idNota clav:conteudo ?nota .
            }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve os termos de índice de uma classe: idTI, termo
Classes.ti = id => {
    var query = `
    SELECT * WHERE { 
        ?idTI a clav:TermoIndice;
              clav:estaAssocClasse clav:${id} ;
              clav:termo ?termo
    }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a(s) entidade(s) dona(s) do processo: id, tipo, sigla, designacao
Classes.dono = id => {
    var query = `
        SELECT ?id ?idDono ?tipo ?idTipo ?sigla ?designacao WHERE { 
            clav:${id} clav:temDono ?id.
            BIND (STRAFTER(STR(?id), 'clav#') AS ?idDono).
            {
                ?id clav:entDesignacao ?designacao;
                    a ?tipo;
                    clav:entSigla ?sigla.
                BIND (STRAFTER(STR(?tipo), 'clav#') AS ?idTipo).
            } UNION {
                ?id clav:tipDesignacao ?designacao;
                a ?tipo;
                clav:tipSigla ?sigla .
                BIND (STRAFTER(STR(?tipo), 'clav#') AS ?idTipo).
            }
        FILTER ( ?tipo NOT IN (owl:NamedIndividual) )
        }`  
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a(s) entidade(s) participante(s) no processo: id, sigla, designacao, tipoParticip
Classes.participante = id => {
    var query = `
        select ?id ?idParticipante ?sigla ?designacao ?idTipo ?tipoParticip ?participLabel where { 
            ?particip rdfs:subPropertyOf clav:temParticipante . FILTER(?particip != clav:temParticipante)
            clav:${id} ?particip ?id .
            BIND (STRAFTER(STR(?particip), '#temParticipante') AS ?participLabel).  
            BIND (STRAFTER(STR(?id), 'clav#') AS ?idParticipante).      
                {
                    ?id clav:entDesignacao ?designacao;
                        a ?tipo;
                        clav:entSigla ?sigla . FILTER(?tipo != owl:NamedIndividual).
                        BIND (STRAFTER(STR(?tipo), 'clav#') AS ?idTipo).
                } UNION {
                    ?id clav:tipDesignacao ?designacao;
                        a ?tipo;
                        clav:tipSigla ?sigla . FILTER(?tipo != owl:NamedIndividual).
                        BIND (STRAFTER(STR(?tipo), 'clav#') AS ?idTipo).
                }      
        }
        order by ?participLabel ?idParticipante`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
Classes.procRel = id => {
    var query = `
        select ?id ?codigo ?titulo ?tipoRel ?idRel {
            clav:${id} clav:temRelProc ?id;
                        ?tipoRel ?id.
        
            ?id clav:codigo ?codigo;
                clav:titulo ?titulo;
                clav:classeStatus 'A'.
        
        filter (?tipoRel!=clav:temRelProc) .
        BIND (STRAFTER(STR(?tipoRel), 'clav#') AS ?idRel).
        } Order by ?idRel ?codigo
        `
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
Classes.procRelEspecifico = (id, rel) => {
    var query = `
        select ?id ?codigo ?titulo {
            clav:${id} clav:temRelProc ?id;
                        clav:${rel} ?id.
            ?id clav:codigo ?codigo;
                clav:titulo ?titulo.
        }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a legislação associada ao contexto de avaliação: id, tipo, numero, sumario
Classes.legislacao = id => {
    var query = `
        SELECT ?id ?idLeg ?tipo ?numero ?sumario WHERE { 
            clav:${id} clav:temLegislacao ?id.
            ?id clav:diplomaNumero ?numero;
                clav:diplomaSumario ?sumario;
                clav:diplomaTipo ?tipo.
            BIND (STRAFTER(STR(?id), 'clav#') AS ?idLeg).
        } order by ?tipo ?numero`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve a informação base do PCA: idPCA, formaContagem, subFormaContagem, idJust, valores, notas
Classes.pca = id => {
    var query = `
        SELECT 
            ?idPCA
            ?formaContagem
            ?subFormaContagem
            ?idJust
            (GROUP_CONCAT(DISTINCT ?valor; SEPARATOR="###") AS ?valores)
            (GROUP_CONCAT(DISTINCT ?nota; SEPARATOR="###") AS ?notas)
        WHERE { 
            clav:${id} clav:temPCA ?idPCA .
            OPTIONAL {
                ?idPCA clav:pcaFormaContagemNormalizada ?contNormID .    
                ?contNormID skos:prefLabel ?formaContagem .
            }
            OPTIONAL {
                ?idPCA clav:pcaSubformaContagem ?subContID .
                ?subContID skos:scopeNote ?subFormaContagem .
            }
            OPTIONAL {
                ?idPCA clav:pcaNota ?nota .
            }
            OPTIONAL {
                ?idPCA clav:pcaValor ?valor .
            }
            OPTIONAL {
                ?idPCA clav:temJustificacao ?idJustificacao .
                BIND (STRAFTER(STR(?idJustificacao), 'clav#') AS ?idJust).
            }    
        }GROUP BY ?idPCA ?formaContagem ?subFormaContagem ?idJust
    `
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
Classes.justificacao = async id => {
    try {
        var query = `
        SELECT
            ?criterio ?tipoLabel ?conteudo
        WHERE {
            clav:${id} clav:temCriterio ?criterio . 
            ?criterio clav:conteudo ?conteudo.
            ?criterio a ?tipo.
            ?tipo rdfs:subClassOf clav:CriterioJustificacao.
            ?tipo rdfs:label ?tipoLabel.
        }`
        let result = await client.query(query).execute();
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve a informação base do DF: idDF, valor, idJustificacao
Classes.df = function (id) {
    var query = `
        SELECT 
            ?idDF ?valor ?idJust
        WHERE { 
            clav:${id} clav:temDF ?idDF .
            OPTIONAL {
                ?idDF clav:dfValor ?valor ;
            }
            OPTIONAL {
                ?idDF clav:dfNota ?Nota ;
            }
            OPTIONAL {
                ?idDF clav:temJustificacao ?idJustificacao .
                BIND (STRAFTER(STR(?idJustificacao), 'clav#') AS ?idJust).
            }    
        }`
    return client.query(query)
        .execute()
        .then(response => normalize(response))
}


// ============================================================================

/**
 * Insere uma nova classe no sistema, gerando um pedido apropriado.
 * A classe criada encontrar-se-á no estado "Harmonização".
 * 
 * @see pedidos
 *
 * @param {Classe} classe que se pretende criar
 * @param {string} utilizador identificação do utilizador que criou a classe
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova classe
 */
Classes.criar = async (classe, utilizador) => {
    Pedidos.criar('Criação', 'Classe', classe, utilizador)
};
Classes.filterCommon = function () {
    var fetchQuery = `
        SELECT DISTINCT
            ?Avo ?AvoCodigo ?AvoTitulo 
            ?Pai ?PaiCodigo ?PaiTitulo 
            ?PN ?PNCodigo ?PNTitulo   
            (GROUP_CONCAT(CONCAT(STR(?Filho),":::",?FilhoCodigo, ":::",?FilhoTitulo); SEPARATOR="###") AS ?Filhos)
        WHERE {  
            ?PN rdf:type clav:Classe_N3 .
            ?PN clav:classeStatus 'A'.

            ?PN clav:processoTipoVC clav:vc_processoTipo_pc .
            
            ?PN clav:temPai ?Pai.
            ?Pai clav:temPai ?Avo.
            
            ?PN clav:codigo ?PNCodigo;
                clav:titulo ?PNTitulo.
            
            ?Pai clav:codigo ?PaiCodigo;
                clav:titulo ?PaiTitulo.
            
            ?Avo clav:codigo ?AvoCodigo;
                clav:titulo ?AvoTitulo.
            
            OPTIONAL {
                ?Filho clav:temPai ?PN;
                   clav:codigo ?FilhoCodigo;
                   clav:titulo ?FilhoTitulo
            }

            MINUS { 
                ?PN clav:pertenceLC ?lc
                filter( ?lc != clav:lc1 )
            }
        }
        Group By ?PN ?PNCodigo ?PNTitulo ?Pai ?PaiCodigo ?PaiTitulo ?Avo ?AvoCodigo ?AvoTitulo 
        Order By ?PN
    `;

    return client.query(fetchQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Classes.filterRest = function (orgs) {
    var fetchQuery = `
        SELECT DISTINCT 
            ?Avo ?AvoCodigo ?AvoTitulo 
            ?Pai ?PaiCodigo ?PaiTitulo 
            ?PN ?PNCodigo ?PNTitulo
            (GROUP_CONCAT(CONCAT(STR(?Filho),":::",?FilhoCodigo, ":::",?FilhoTitulo); SEPARATOR="###") AS ?Filhos)
        WHERE { 
            ?PN rdf:type clav:Classe_N3 .
            ?PN clav:classeStatus 'A'.

            ?PN clav:processoTipoVC clav:vc_processoTipo_pe .
            
            MINUS { 
                ?PN clav:pertenceLC ?lc
                filter( ?lc != clav:lc1 )
            }
    `;
    if (orgs) {
        fetchQuery += `
                MINUS {
                    {
                        SELECT ?PN where {
                            VALUES ?org { clav:${orgs.join(' clav:')} }
                            ?org clav:eDonoProcesso ?PN .
                        }
                    } UNION {
                        SELECT ?PN where {
                            VALUES ?org { clav:${orgs.join(' clav:')} }
                            ?org clav:participaEm ?PN .
                        }
                    }
                }
        `;
    }
    fetchQuery += `
            ?PN clav:temPai ?Pai.
            ?Pai clav:temPai ?Avo.
            
            ?PN clav:codigo ?PNCodigo;
                clav:titulo ?PNTitulo.
            
            ?Pai clav:codigo ?PaiCodigo;
                clav:titulo ?PaiTitulo.
            
            ?Avo clav:codigo ?AvoCodigo;
                clav:titulo ?AvoTitulo.
            
            OPTIONAL {
                ?Filho clav:temPai ?PN;
                    clav:codigo ?FilhoCodigo;
                    clav:titulo ?FilhoTitulo
            }
        }
        GROUP BY ?PN ?PNCodigo ?PNTitulo ?Pai ?PaiCodigo ?PaiTitulo ?Avo ?AvoCodigo ?AvoTitulo 
        ORDER BY ?PN
    `;

    return client.query(fetchQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Classes.createClass = function (data) {
    var id = "c" + data.Code;
    var level = "Classe_N" + data.Level;

    var createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:${level} ;
                    clav:codigo "${data.Code}" ;
                    clav:classeStatus "H" ;
                    clav:descricao "${data.Description.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" ;
                    clav:pertenceLC clav:lc1 ;
                    clav:titulo "${data.Title}" .                   
        `;

    if (data.Level > 1) {
        createQuery += 'clav:' + id + ' clav:temPai clav:' + data.Parent + ' .\n';
    }

    if (data.AppNotes && data.AppNotes.length) {
        for (var i = 0; i < data.AppNotes.length; i++) {
            createQuery += `
                    clav:${data.AppNotes[i].id} rdf:type owl:NamedIndividual ,
                            clav:NotaAplicacao ;
                        clav:conteudo "${data.AppNotes[i].Note.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" .
                `;
            createQuery += 'clav:' + id + ' clav:temNotaAplicacao clav:' + data.AppNotes[i].id + ' .\n';
        }
    }

    if (data.ExAppNotes && data.ExAppNotes.length) {
        for (var i = 0; i < data.ExAppNotes.length; i++) {
            createQuery += 'clav:' + id + ' clav:temExemploNA "' + data.ExAppNotes[i].replace(/\n/g, '\\n').replace(/\"/g, "\\\"") + '" .\n';
        }
    }

    if (data.DelNotes && data.DelNotes.length) {
        for (var i = 0; i < data.DelNotes.length; i++) {
            createQuery += `
                    clav:${data.DelNotes[i].id} rdf:type owl:NamedIndividual ,
                            clav:NotaExclusao ;
                        clav:conteudo "${data.DelNotes[i].Note.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" .
                `;
            createQuery += 'clav:' + id + ' clav:temNotaExclusao clav:' + data.DelNotes[i].id + ' .\n';
        }
    }

    if (data.Level >= 3 && data.Indexes && data.Indexes.length) {
        for (let [i, index] of data.Indexes.entries()) {
            createQuery += `
                clav:ti_${id}_${i + 1} rdf:type owl:NamedIndividual ,
                        clav:TermoIndice ;
                    clav:termo "${index.Note.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" ;
                    clav:estaAssocClasse clav:${id} .
            `;
        }
    }

    if (data.Level >= 3 && data.Type) {
        createQuery += 'clav:' + id + ' clav:processoTipoVC clav:vc_processoTipo_' + data.Type + ' .\n';
    }

    if (data.Level >= 3 && data.Trans) {
        createQuery += 'clav:' + id + ' clav:processoTransversal "' + data.Trans + '" .\n';
    }

    if (data.Level >= 3 && data.Owners && data.Owners.length) {
        for (let owner of data.Owners) {
            createQuery += `clav:${id} clav:temDono clav:${owner} .\n`;
        }
    }

    if (data.Level >= 3 && data.Trans == 'S' && data.Participants) {
        for (let key in data.Participants) {
            for (let part of data.Participants[key]) {
                createQuery += `clav:${id} clav:temParticipante${key} clav:${part} .\n`;
            }
        }
    }

    if (data.Level >= 3 && data.RelProcs) {
        for (let proc of data.RelProcs) {
            createQuery += `clav:${id} clav:${proc.relType} clav:${proc.id} .\n`;
        }
    }

    if (data.Legislations && data.Legislations.length) {
        for (let doc of data.Legislations) {
            createQuery += `clav:${id} clav:temLegislacao clav:${doc} .\n`;
        }
    }

    if (data.Level >= 3 && data.PCA) {
        createQuery += `
            clav:pca_${id} rdf:type owl:NamedIndividual ,
                    clav:PCA ;
                clav:pcaFormaContagemNormalizada clav:${data.PCA.count.id} ;
                clav:pcaValor '${data.PCA.dueDate}' .
            
            clav:just_pca_${id} rdf:type owl:NamedIndividual ,
                    clav:JustificacaoPCA .
            clav:pca_${id} clav:temJustificacao clav:just_pca_${id} .

            clav:${id} clav:temPCA clav:pca_${id} .
        `;

        if (data.PCA.count.id == 'vc_pcaFormaContagem_disposicaoLegal' && data.PCA.subcount.id) {
            createQuery += `clav:pca_${id} clav:pcaSubformaContagem clav:${data.PCA.subcount.id} .`;
        }

        if (data.PCA.criteria) {
            for (let [i, crit] of data.PCA.criteria.entries()) {
                let critID = `clav:crit_jpca_${id}_${i + 1}`;

                createQuery += `
                    ${critID} rdf:type owl:NamedIndividual ,
                            clav:${crit.type.value} ;
                        clav:conteudo '${crit.content.replace(/\n/g, '\\n')}' .
                    clav:just_pca_${id} clav:temCriterio ${critID} .
                `;

                if (crit.pns) {
                    for (let pn of crit.pns) {
                        createQuery += `
                            ${critID} clav:temProcessoRelacionado clav:${pn.id} .
                        `;
                    }
                }
                if (crit.leg) {
                    for (let doc of crit.leg) {
                        createQuery += `
                            ${critID} clav:temLegislacao clav:${doc.id} .
                        `;
                    }
                }
            }
        }
    }

    if (data.Level >= 3 && data.DF) {
        createQuery += `
            clav:df_${id} rdf:type owl:NamedIndividual ,
                    clav:DestinoFinal ;
                clav:dfValor '${data.DF.end}' .

            clav:just_df_${id} rdf:type owl:NamedIndividual ,
                    clav:JustificacaoDF . 
            
            clav:df_${id} clav:temJustificacao clav:just_df_${id} .

            clav:${id} clav:temDF clav:df_${id} .
        `;

        if (data.DF.criteria) {
            for (let [i, crit] of data.DF.criteria.entries()) {
                let critID = `clav:crit_just_df_${id}_${i + 1}`;

                createQuery += `
                    ${critID} rdf:type owl:NamedIndividual ,
                            clav:${crit.type.value} ;
                        clav:conteudo '${crit.content.replace(/\n/g, '\\n')}' .
                    clav:just_df_${id} clav:temCriterio ${critID} .
                `;

                if (crit.pns) {
                    for (let pn of crit.pns) {
                        createQuery += `
                            ${critID} clav:temProcessoRelacionado clav:${pn.id} .
                        `;
                    }
                }
                if (crit.leg) {
                    for (let doc of crit.leg) {
                        createQuery += `
                            ${critID} clav:temLegislacao clav:${doc.id} .
                        `;
                    }
                }
            }
        }
    }

    createQuery += '}';

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));


}

Classes.updateClass = function (dataObj) {
    function prepDelete(dataObj) {
        let deletePart = "\n";

        if (dataObj.ExAppNotes && dataObj.ExAppNotes.length) {
            deletePart += `
                clav:${dataObj.id} clav:temExemploNA ?exNA .
            `;
        }
        if (dataObj.AppNotes) {
            deletePart += `
                clav:${dataObj.id} clav:temNotaAplicacao ?na .
                ?na ?naP ?naO .
            `;
        }
        if (dataObj.DelNotes) {
            deletePart += `
                clav:${dataObj.id} clav:temNotaExclusao ?ne .
                ?ne ?neP ?neO .
            `;
        }
        if (dataObj.Indexes) {
            deletePart += `
                ?ti clav:estaAssocClasse clav:${dataObj.id} .
                ?ti ?tiP ?tiO .
            `;
        }

        //relations
        if (dataObj.Owners && dataObj.Owners.Delete && dataObj.Owners.Delete.length) {
            for (var i = 0; i < dataObj.Owners.Delete.length; i++) {
                deletePart += "\tclav:" + dataObj.id + " clav:temDono clav:" + dataObj.Owners.Delete[i].id + " .\n";
            }
        }
        if (dataObj.Legs && dataObj.Legs.Delete && dataObj.Legs.Delete.length) {
            for (var i = 0; i < dataObj.Legs.Delete.length; i++) {
                deletePart += "\tclav:" + dataObj.id + " clav:temLegislacao clav:" + dataObj.Legs.Delete[i].id + " .\n";
            }
        }

        var relKeys = Object.keys(dataObj.RelProcs);

        for (var k = 0; k < relKeys.length; k++) {
            if (dataObj.RelProcs[relKeys[k]].Delete && dataObj.RelProcs[relKeys[k]].Delete.length) {
                for (var i = 0; i < dataObj.RelProcs[relKeys[k]].Delete.length; i++) {
                    deletePart += "\tclav:" + dataObj.id + " clav:e" + relKeys[k].replace(/ /, '') + " clav:" + dataObj.RelProcs[relKeys[k]].Delete[i].id + " .\n";
                }
            }
        }

        var partKeys = Object.keys(dataObj.Participants);

        for (var k = 0; k < partKeys.length; k++) {
            if (dataObj.Participants[partKeys[k]].Delete && dataObj.Participants[partKeys[k]].Delete.length) {
                for (var i = 0; i < dataObj.Participants[partKeys[k]].Delete.length; i++) {
                    deletePart += "\tclav:" + dataObj.id + " clav:temParticipante" + partKeys[k] + " clav:" + dataObj.Participants[partKeys[k]].Delete[i].id + " .\n";
                }
            }
        }

        if (dataObj.PCA) {
            for (let [i, critID] of dataObj.PCA.criteria.Delete.entries()) {
                deletePart += `
                    clav:just_pca_${dataObj.id} clav:temCriterio clav:${critID} .
                `;
            }
            
            for (let [i, crit] of dataObj.PCA.criteria.Change.entries()) {
                deletePart += `
                clav:just_pca_${dataObj.id} clav:temCriterio clav:${crit.id} .
                `;
            }

            if(dataObj.PCA.count){
                deletePart += `
                    clav:pca_${dataObj.id} clav:pcaSubformaContagem ?pcaSubCount .
                `;
            }
            
        }
        if (dataObj.DF) {
            for (let [i, critID] of dataObj.DF.criteria.Delete.entries()) {
                deletePart += `
                    clav:just_df_${dataObj.id} clav:temCriterio clav:${critID} .
                `;
            }
            
            for (let [i, crit] of dataObj.DF.criteria.Change.entries()) {
                deletePart += `
                clav:just_df_${dataObj.id} clav:temCriterio clav:${crit.id} .
                `;
            }
        }


        return deletePart;
    }

    function prepDelWhere(dataObj) {
        let wherePart = "\n";
        //atributes
        if (dataObj.Title) {
            wherePart += "\tclav:" + dataObj.id + " clav:titulo ?tit .\n";
        }
        if (dataObj.Status) {
            wherePart += "\tclav:" + dataObj.id + " clav:classeStatus ?status .\n";
        }
        if (dataObj.Desc) {
            wherePart += "\tclav:" + dataObj.id + " clav:descricao ?desc .\n";
        }
        if (dataObj.ProcType) {
            wherePart += "\tclav:" + dataObj.id + " clav:processoTipoVC ?ptipo .\n";
        }
        if (dataObj.ProcTrans) {
            wherePart += "\tclav:" + dataObj.id + " clav:processoTransversal ?ptrans .\n";
        }

        if (dataObj.PCA) {
            if(dataObj.PCA.value){
                wherePart += `
                    clav:pca_${dataObj.id} clav:pcaValor ?pcaVal .
                `;
            }
            if(dataObj.PCA.count){
                wherePart += `
                    clav:pca_${dataObj.id} clav:pcaFormaContagemNormalizada ?pcaCount .
                `;
            }

            for (let [i, critID] of dataObj.PCA.criteria.Delete.entries()) {
                wherePart += `
                    clav:${critID} ?pcaCritDelP${i} ?pcaCritDelO${i} .
                `;
            }
            
            for (let [i, crit] of dataObj.PCA.criteria.Change.entries()) {
                wherePart += `
                    clav:${crit.id} ?pcaCritUpdP${i} ?pcaCritUpdO${i} .
                `;
            }
        }

        if (dataObj.DF) {
            if(dataObj.DF.dest) {
                wherePart += `
                    clav:df_${dataObj.id} clav:dfValor ?dfDest .
                `;
            }

            for (let [i, critID] of dataObj.DF.criteria.Delete.entries()) {
                wherePart += `
                    clav:${critID} ?dfCritDelP${i} ?dfCritDelO${i} .
                `;
            }
            
            for (let [i, crit] of dataObj.DF.criteria.Change.entries()) {
                wherePart += `
                    clav:${crit.id} ?dfCritUpdP${i} ?dfCritUpdO${i} .
                `;
            }
        }

        return wherePart;
    }

    function prepInsert(dataObj) {
        let insertPart = "\n";

        //attributes
        if (dataObj.Title) {
            insertPart += "\tclav:" + dataObj.id + " clav:titulo '" + dataObj.Title + "' .\n";
        }
        if (dataObj.Status) {
            insertPart += "\tclav:" + dataObj.id + " clav:classeStatus '" + dataObj.Status + "' .\n";
        }
        if (dataObj.Desc) {
            insertPart += "\tclav:" + dataObj.id + " clav:descricao '" + dataObj.Desc.replace(/\n/g, '\\n').replace(/\"/g, "\\\"") + "' .\n";
        }
        if (dataObj.ProcType) {
            insertPart += "\tclav:" + dataObj.id + " clav:processoTipoVC clav:vc_processoTipo_" + dataObj.ProcType + " .\n";
        }
        if (dataObj.ProcTrans) {
            insertPart += "\tclav:" + dataObj.id + " clav:processoTransversal '" + dataObj.ProcTrans + "' .\n";
        }
        if (dataObj.ExAppNotes && dataObj.ExAppNotes.length) {
            for (var i = 0; i < dataObj.ExAppNotes.length; i++) {
                if (dataObj.ExAppNotes[i].Exemplo) {
                    insertPart += `\tclav:${dataObj.id} clav:temExemploNA "${dataObj.ExAppNotes[i].Exemplo.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" .\n`;
                }
            }
        }

        //Notas de aplicação
        if (dataObj.AppNotes && dataObj.AppNotes.length) {
            for (let note of dataObj.AppNotes) {
                if (note.Nota) {
                    insertPart += `
                        clav:${note.id} rdf:type owl:NamedIndividual ,
                                clav:NotaAplicacao ;
                            clav:conteudo "${note.Nota.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" .
                        clav:${dataObj.id} clav:temNotaAplicacao clav:${note.id} .
                    `;
                }
            }
        }
        //Notas de exclusão
        if (dataObj.DelNotes && dataObj.DelNotes.length) {
            for (let note of dataObj.DelNotes) {
                if (note.Nota) {
                    insertPart += `
                        clav:${note.id} rdf:type owl:NamedIndividual ,
                                clav:NotaExclusao ;
                            clav:conteudo "${note.Nota.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" .
                        clav:${dataObj.id} clav:temNotaExclusao clav:${note.id} .
                    `;
                }
            }
        }
        //Termos de Indice
        if (dataObj.Indexes && dataObj.Indexes.length) {
            for (let ti of dataObj.Indexes) {
                if (ti.Termo) {
                    insertPart += `
                        clav:${ti.id} rdf:type owl:NamedIndividual ,
                                clav:TermoIndice ;
                            clav:termo "${ti.Termo.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}" ;
                            clav:estaAssocClasse clav:${dataObj.id} .
                    `;
                }
            }
        }
        //Donos
        if (dataObj.Owners.Add && dataObj.Owners.Add.length) {
            for (var i = 0; i < dataObj.Owners.Add.length; i++) {
                insertPart += "\tclav:" + dataObj.id + " clav:temDono clav:" + dataObj.Owners.Add[i].id + " .\n";
            }
        }
        //Legislação
        if (dataObj.Legs.Add && dataObj.Legs.Add.length) {
            for (var i = 0; i < dataObj.Legs.Add.length; i++) {
                insertPart += "\tclav:" + dataObj.id + " clav:temLegislacao clav:" + dataObj.Legs.Add[i].id + " .\n";
            }
        }
        //Relações com Processos 
        var relKeys = Object.keys(dataObj.RelProcs);

        for (var k = 0; k < relKeys.length; k++) {
            if (dataObj.RelProcs[relKeys[k]].Add && dataObj.RelProcs[relKeys[k]].Add.length) {
                for (var i = 0; i < dataObj.RelProcs[relKeys[k]].Add.length; i++) {
                    insertPart += "\tclav:" + dataObj.id + " clav:e" + relKeys[k].replace(/ /, '') + " clav:" + dataObj.RelProcs[relKeys[k]].Add[i].id + " .\n";
                }
            }
        }
        //Participantes
        var partKeys = Object.keys(dataObj.Participants);

        for (var k = 0; k < partKeys.length; k++) {
            if (dataObj.Participants[partKeys[k]].Add && dataObj.Participants[partKeys[k]].Add.length) {
                for (var i = 0; i < dataObj.Participants[partKeys[k]].Add.length; i++) {
                    insertPart += "\tclav:" + dataObj.id + " clav:temParticipante" + partKeys[k] + " clav:" + dataObj.Participants[partKeys[k]].Add[i].id + " .\n";
                }
            }
        }

        //PCA
        if (dataObj.PCA) {
            if(dataObj.PCA.value){
                insertPart += `
                    clav:pca_${dataObj.id} clav:pcaValor '${dataObj.PCA.value}' .
                `;
            }
            if(dataObj.PCA.count){
                insertPart += `
                    clav:pca_${dataObj.id} clav:pcaFormaContagemNormalizada clav:${dataObj.PCA.count} .
                `;

                if(dataObj.PCA.count=="vc_pcaFormaContagem_disposicaoLegal"){
                    insertPart += `
                        clav:pca_${dataObj.id} clav:pcaSubformaContagem clav:${dataObj.PCA.subcount} .
                    `;
                }
            }

            for (let crit of dataObj.PCA.criteria.Add.concat(dataObj.PCA.criteria.Change)) {
                insertPart += `
                    clav:${crit.id} rdf:type owl:NamedIndividual ,
                            clav:${crit.type};
                        clav:conteudo "${crit.note.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}".
                `;

                for (let doc of crit.leg) {
                    insertPart += `
                        clav:${crit.id} clav:temLegislacao clav:${doc.id} .
                    `;
                }

                for (let pn of crit.pns) {
                    insertPart += `
                        clav:${crit.id} clav:temProcessoRelacionado clav:${pn.id} .
                    `;
                }

                insertPart += `
                    clav:just_pca_${dataObj.id} clav:temCriterio clav:${crit.id} .
                `;
            }
        }

        if (dataObj.DF) {
            if(dataObj.DF.dest) {
                insertPart += `
                    clav:df_${dataObj.id} clav:dfValor '${dataObj.DF.dest}' .
                `;
            }

            for (let crit of dataObj.DF.criteria.Add.concat(dataObj.DF.criteria.Change)) {
                insertPart += `
                    clav:${crit.id} rdf:type owl:NamedIndividual ,
                            clav:${crit.type};
                        clav:conteudo "${crit.note.replace(/\n/g, '\\n').replace(/\"/g, "\\\"")}".
                `;

                for (let doc of crit.leg) {
                    insertPart += `
                        clav:${crit.id} clav:temLegislacao clav:${doc.id} .
                    `;
                }

                for (let pn of crit.pns) {
                    insertPart += `
                        clav:${crit.id} clav:temProcessoRelacionado clav:${pn.id} .
                    `;
                }

                insertPart += `
                    clav:just_df_${dataObj.id} clav:temCriterio clav:${crit.id} .
                `;
            }
        }

        return insertPart;
    }

    function prepWhere(dataObj) {
        let retWhere = "\n";
        if (dataObj.AppNotes) {
            retWhere += `
                optional{
                    clav:${dataObj.id} clav:temNotaAplicacao ?na .
                    ?na ?naP ?naO .
                }
            `;
        }
        if (dataObj.DelNotes) {
            retWhere += `
                optional{
                    clav:${dataObj.id} clav:temNotaExclusao ?ne .
                    ?ne ?neP ?neO .
                }
            `;
        }
        if (dataObj.ExAppNotes && dataObj.ExAppNotes.length) {
            retWhere += `
                optional{
                    clav:${dataObj.id} clav:temExemploNA ?exNA .
                }
            `;
        }
        if (dataObj.Indexes) {
            retWhere += `
                optional{
                    ?ti clav:estaAssocClasse clav:${dataObj.id} .
                    ?ti ?tiP ?tiO .
                }
            `;
        }
        if(dataObj.PCA && dataObj.PCA.count){
            retWhere += `
                optional{
                    clav:pca_${dataObj.id} clav:pcaSubformaContagem ?pcaSubCount .
                }
            `;
        }
        return retWhere;
    }

    var deletePart = prepDelete(dataObj);
    var insertPart = prepInsert(dataObj);
    var delwherePart = prepDelWhere(dataObj);
    var wherePart = prepWhere(dataObj);

    var updateQuery = `
        DELETE {
            ${delwherePart}
            ${deletePart}
        }
        INSERT{
            ${insertPart}
        }
        WHERE {
            ${delwherePart}
            ${wherePart}
        }
    `;
    
    
    return client.query(updateQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
}

Classes.deleteClass = function (id) {
    /*var delQuery = `
        DELETE {
            clav:${id} ?p ?o .
            ?relS ?relP clav:${id} .
            ?na ?naP ?naO .
            ?ne ?neP ?neO .
        }
        WHERE {
            clav:${id} ?p ?o .
            OPTIONAL {
                ?relS ?relP clav:${id} .
            }
            OPTIONAL {
                clav:${id} clav:temNotaAplicacao ?na .
                ?na ?naP ?naO .
            }
            OPTIONAL{
                clav:${id} clav:temNotaExclusao ?ne .
                ?ne ?neP ?neO .
            }
        }
    `;*/

    var delQuery = `
        DELETE {
            clav:${id} clav:classeStatus ?status .
        }
        INSERT {
            clav:${id} clav:classeStatus 'I' .
        }
        WHERE {
            clav:${id} clav:classeStatus ?status .
        }
    `;

    return client.query(delQuery).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}