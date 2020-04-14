const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
const Classes = module.exports

// Devolve a lista de classes de um determinado nível, por omissão do nível 1
Classes.listar = async nivel => {
    if (!nivel) nivel = 1;

    var query = `
        Select
            ?id 
            ?codigo 
            ?titulo 
            ?status
        Where {
            ?id rdf:type clav:Classe_N${nivel} ;   
                    clav:classeStatus ?status;   
                    clav:codigo ?codigo ;
                    clav:titulo ?titulo .
        } 
        Order by ?id 
    `
    try {
        let result = await execQuery("query", query);
        return normalize(result);
    }
    catch (erro) { throw (erro); }
}

// Devolve a lista de classes de nível 3 que são consideradas processos comuns
Classes.listarPNsComuns = () => {
    var query = `
    Select
			?id
            ?codigo 
            ?titulo 
            ?status
            ?transversal
        Where {
            ?id clav:processoTipoVC clav:vc_processoTipo_pc .
            ?id clav:classeStatus ?status .
            ?id clav:codigo ?codigo .
            ?id clav:titulo ?titulo .
            ?id clav:processoTransversal ?transversal.
        } 
    `

    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve a lista de classes de nível 3 que são consideradas processos específicos de uma dada entidade e de diferentes tipologias
Classes.listarPNsEspecificos = async (entidades, tipologias) => {
    var query = `
    Select
            ?id
            ?codigo
            ?titulo
            ?status
            ?transversal
        Where {
            ?id clav:processoTipoVC clav:vc_processoTipo_pe .
            ?id clav:classeStatus ?status .
        `
    if (entidades) {
        query += `
            { ?id clav:temDono clav:${entidades[0]} } 
            Union { ?id clav:temParticipante clav:${entidades[0]} }
            `
        if (entidades.length > 1) {
            for (var i = 1; i < entidades.length; i++) {
                query += `
                    Union { ?id clav:temDono clav:${entidades[i]} } 
                    Union { ?id clav:temParticipante clav:${entidades[i]} }
                    `
            }
        }

    }

    if (tipologias) {
        for (var i = 0; i < tipologias.length; i++) {
            query += `
                Union { ?id clav:temDono clav:${tipologias[i]}}
                Union { ?id clav:temParticipante clav:${tipologias[i]}}
        `
        }
    }

    query += `
        ?id clav:codigo ?codigo .
        ?id clav:titulo ?titulo .
        ?id clav:processoTransversal ?transversal.
        }
        Group by ?codigo ?titulo ?id ?status ?transversal
        Order by ?codigo
    `

    return execQuery("query", query)
        .then(response => normalize(response))
}

function sortEntsTips(lista){
    var ret = lista.sort((d1, d2) => {
        var compSigla = d1.sigla.localeCompare(d2.sigla)
        var ret = compSigla

        if(compSigla == 0){
            ret = d1.designacao.localeCompare(d2.designacao)
        }

        return ret
    })

    return ret
}

// Devolve toda a informação de uma classe
Classes.retrieve = async id => {
    try {
        var classe = {
            // Metainformação e campos da área de Descrição

            nivel: 1,
            pai: {},
            codigo: "",
            titulo: "",
            descricao: "",
            status: "",
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
                valores: "",
                notas: "",
                formaContagem: "",
                subFormaContagem: "",
                justificacao: []        // j = [criterio]
            },                          // criterio = {tipo, notas, [proc], [leg]}

            df: {
                valor: "NE",
                nota: null,
                justificacao: []
            }
        };

        let base = await Classes.consultar(id)
        classe.id = base[0].id
        classe.nivel = base[0].codigo.split('.').length
        classe.codigo = base[0].codigo
        classe.pai.codigo = base[0].codigoPai
        classe.pai.titulo = base[0].tituloPai
        classe.titulo = base[0].titulo
        classe.descricao = base[0].desc
        classe.status = base[0].status
        classe.tipoProc = base[0].procTipo || ""
        classe.procTrans = base[0].procTrans || ""

        classe.filhos = await Classes.descendencia(id)
        if (classe.filhos.length > 0) {
            if (classe.nivel == 3) classe.temSubclasses4Nivel = true
        }

        classe.notasAp = await Classes.notasAp(id)
        classe.exemplosNotasAp = await Classes.exemplosNotasAp(id)
        classe.notasEx = await Classes.notasEx(id)
        classe.termosInd = await Classes.ti(id)
        classe.donos = sortEntsTips(await Classes.dono(id))
        classe.participantes = sortEntsTips(await Classes.participante(id))
        classe.processosRelacionados = await Classes.procRel(id)
        classe.legislacao = await Classes.legislacao(id)

        let pca = await Classes.pca(id)
        if (pca.length > 0 && (pca[0].valores != "") || (pca[0].notas != "")) classe.pca = pca[0]

        if (classe.pca && classe.pca.idJust) {
            classe.pca.justificacao = await Classes.justificacao(classe.pca.idJust)
        }

        let df = await Classes.df(id)
        if (df.length > 0) classe.df = df[0]
        if (classe.df && classe.df.idJust) {
            classe.df.justificacao = await Classes.justificacao(classe.df.idJust)
        }

        return classe
    }
    catch (erro) {
        throw (erro);
    }
}

//Devolve a informação das classes da subárvore com raiz na classe com o id 'id'
Classes.subarvore = async id => {
    var raiz = await Classes.retrieve(id)

    for (var i = 0; i < raiz.filhos.length; i++) {
        raiz.filhos[i] = await Classes.subarvore('c' + raiz.filhos[i].codigo)
    }

    return raiz
}

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTipo?
Classes.consultar = async id => {
    var query = `
            SELECT * WHERE { 
                clav:${id} clav:titulo ?titulo;
                    clav:codigo ?codigo;
                    clav:classeStatus ?status;
                    clav:descricao ?desc.

                ?id clav:codigo ?codigo .

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
    let resultado = await execQuery("query", query)
    return normalize(resultado)
}

// Devolve a lista de filhos de uma classe: id, codigo, titulo
Classes.descendencia = async id => {
    try {
        var query = `
            SELECT ?id ?codigo ?titulo ?status
            WHERE {
                ?id clav:temPai clav:${id} ;
                    clav:classeStatus ?status;
                    clav:codigo ?codigo ;
                    clav:titulo ?titulo .
            }
            ORDER BY ?codigo
            `
        let resultado = await execQuery("query", query);
        return normalize(resultado);
    }
    catch (erro) {
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
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve a lista de exemplos de notas de aplicação de uma classe: [exemplo]
Classes.exemplosNotasAp = id => {
    var query = `
            SELECT ?idExemplo ?exemplo WHERE { 
                clav:${id} clav:temExemploNA ?idExemplo.
                ?idExemplo clav:conteudo ?exemplo.
            }`
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
Classes.notasEx = id => {
    var query = `
            SELECT * WHERE { 
                clav:${id} clav:temNotaExclusao ?idNota.
                ?idNota clav:conteudo ?nota .
            }`
    return execQuery("query", query)
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
    return execQuery("query", query)
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
    return execQuery("query", query)
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
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
Classes.procRel = id => {
    var query = `
        select ?id ?codigo ?titulo ?tipoRel ?idRel ?status WHERE{
            clav:${id} clav:temRelProc ?id;
                        ?tipoRel ?id.
        
            ?id clav:codigo ?codigo;
                clav:titulo ?titulo;
                clav:classeStatus ?status.
        
        filter (?tipoRel!=clav:temRelProc) .
        BIND (STRAFTER(STR(?tipoRel), 'clav#') AS ?idRel).
        } Order by ?idRel ?codigo
        `
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
Classes.procRelEspecifico = (id, rel) => {
    var query = `
        select ?id ?codigo ?titulo WHERE{
            clav:${id} clav:temRelProc ?id;
                        clav:${rel} ?id.
            ?id clav:codigo ?codigo;
                clav:titulo ?titulo.
        }`
    return execQuery("query", query)
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
    return execQuery("query", query)
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
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
/*Classes.justificacao = async id => {
    try {
        var query = `
        SELECT
            ?criterio ?tipoId ?tipoLabel ?conteudo
        WHERE {
            clav:${id} clav:temCriterio ?criterio . 
            ?criterio clav:conteudo ?conteudo.
            ?criterio a ?tipo.
            ?tipo rdfs:subClassOf clav:CriterioJustificacao.
            ?tipo rdfs:label ?tipoLabel.
            BIND (STRAFTER(STR(?tipo), 'clav#') AS ?tipoId).
        }`
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}*/

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, procs relacionados e leg
Classes.justificacao = async id => {
    try {
        var query = `
        SELECT
            ?criterio ?tipoId ?proc ?conteudo
        WHERE {
            clav:${id} clav:temCriterio ?criterio . 
            ?criterio a ?tipo.
            ?criterio clav:conteudo ?conteudo.
            ?tipo rdfs:subClassOf clav:CriterioJustificacao.
            BIND (STRAFTER(STR(?tipo), 'clav#') AS ?tipoId).
        }`
        let result = await execQuery("query", query);
        let criterios = normalize(result)
        for (var i = 0; i < criterios.length; i++) {
            // Processos relacionados aos critérios
            query = `
            SELECT ?procId 
            WHERE {
                <${criterios[i].criterio}> clav:critTemProcRel ?proc .
                BIND (STRAFTER(STR(?proc), 'clav#') AS ?procId).
            }`
            let result = await execQuery("query", query);
            let processos = normalize(result)
            criterios[i].processos = processos
            // Legislação associada aos critérios
            query = `
            SELECT ?legId
            WHERE {
                <${criterios[i].criterio}> clav:critTemLegAssoc ?leg .
                BIND (STRAFTER(STR(?leg), 'clav#') AS ?legId).
            }`
            result = await execQuery("query", query);
            let legislacao = normalize(result)
            criterios[i].legislacao = legislacao
        }
        return criterios;
    }
    catch (erro) { throw (erro); }
}

// Devolve a informação base do DF: idDF, valor, idJustificacao
Classes.df = function (id) {
    var query = `
        SELECT 
            ?idDF ?valor ?nota ?idJust
        WHERE { 
            clav:${id} clav:temDF ?idDF .
            OPTIONAL {
                ?idDF clav:dfValor ?valor ;
            }
            OPTIONAL {
                ?idDF clav:dfNota ?nota ;
            }
            OPTIONAL {
                ?idDF clav:temJustificacao ?idJustificacao .
                BIND (STRAFTER(STR(?idJustificacao), 'clav#') AS ?idJust).
            }    
        }`
    return execQuery("query", query)
        .then(response => normalize(response))
}

// Devolve as estatísticas relacionais dos Processos
Classes.relStats = async () => {
    var query = `
    Select 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE {
        ?pn a clav:Classe_N3 .
        {?o a clav:Classe_N3} UNION {?o a clav:Entidade} UNION {?o a clav:Legislacao} .
        ?pn ?indicador ?o .
    } Group by ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}

// Devolve as estatísticas relativas dos Critérios de Justificações
Classes.critStats = async () => {
    var query = `
    SELECT 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE{
        ?c a clav:CriterioJustificacao .
        ?c a ?indicador .
    FILTER(?indicador != owl:NamedIndividual && ?indicador != clav:AtributoComposto) .
    }
    GROUP BY ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}

// Devolve as estatísticas relacionais aos aos Destinos finais
Classes.dfStats = async () => {
    var query = `
    SELECT 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE{
        ?s clav:temDF ?d .
        ?d clav:dfValor ?indicador .
    } Group by ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}