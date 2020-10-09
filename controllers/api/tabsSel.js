const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
const projection = require("../../controllers/api/utils").projection;
var Pedidos = require('../../controllers/api/pedidos');
const { pca } = require('./classes');
var Classe = require('../../controllers/api/classes')
var Tipologias = require('../../controllers/api/tipologias')
var State = require('../../controllers/state')
var SelTabs = module.exports

SelTabs.list = async function () {
    let query = `
    SELECT * WHERE { 
        ?id rdf:type clav:TabelaSelecao ;
            clav:designacao ?designacao ;
            clav:dataAprovacao ?data ;
            clav:temEntidade ?entidades .
    }
    `
    const campos = [
        "id",
        "designacao",
        "data"
    ];
    const agrupar = ["entidades"];

    try {
        let result = await execQuery("query", query);
        return projection(normalize(result), campos, agrupar);
    }
    catch (erro) { throw erro; }
}

SelTabs.consultar = async function (id) {
    let query = `
        select * where {
            clav:${id} a clav:TabelaSelecao ;
                    clav:designacao ?designacao ;
                    clav:dataAprovacao ?data ;
                    clav:temEntidade ?entidades ;
                    clav:tsResponsavel ?responsavel ;
                    clav:temEntidadeResponsavel ?entidade .
        }
    `
    try {
        let response = await execQuery("query", query);
        response = normalize(response)

        var res = {
            designacao: response[0].designacao,
            data: response[0].data,
            entidades: response.map(r => { return r.entidades.split("#ent_")[1] }),
            responsavel: response[0].responsavel,
            entidade: response[0].entidade.split("#ent_")[1],
            classes: []
        }

        query = `
            select * where {
                ?classe clav:pertenceTS clav:${id} ;
                        clav:codigo ?codigo .
            } order by ?codigo
        `

        let listClasses = await execQuery("query", query);
        listClasses = normalize(listClasses)

        for (var classe of listClasses) {
            var c = await Classe.retrieve(classe.classe.split("clav#")[1])
            res.classes.push(c)
        }

        return res
    }
    catch (err) { throw err; }
}

SelTabs.listClasses = function (table) {
    var listQuery = `
        SELECT DISTINCT
            ?Avo ?AvoCodigo ?AvoTitulo 
            ?Pai ?PaiCodigo ?PaiTitulo 
            ?PN ?PNCodigo ?PNTitulo   
            (GROUP_CONCAT(CONCAT(STR(?Filho),":::",?FilhoCodigo, ":::",?FilhoTitulo); SEPARATOR="###") AS ?Filhos)
        WHERE {  
            
            ?PN rdf:type clav:Classe_N3.
            ?PN clav:pertenceLC clav:${table}.
            
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
        Group By ?PN ?PNCodigo ?PNTitulo ?Pai ?PaiCodigo ?PaiTitulo ?Avo ?AvoCodigo ?AvoTitulo 
        Order By ?PN
        `;


    return execQuery("query", listQuery)
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.classChildren = function (parent, table) {
    var fetchQuery = `
        SELECT ?Child ?Code ?Title (count(?sub) as ?NChilds)
        WHERE {
            ?Child clav:temPai clav:${parent} ;
                    clav:codigo ?Code ;
                    clav:titulo ?Title
            optional {
                ?sub clav:temPai ?Child ;
            }
        }Group by ?Child ?Code ?Title
        `;

    return execQuery("query", fetchQuery)
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.stats = function (id) {
    return execQuery("query",
        `SELECT * WHERE { 
                clav:${id} rdf:type clav:TabelaSelecao ;
                    clav:designacao ?Name .
            }`
    )
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.createTab = function (id, name, classes, criteriaData) {

    var createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:TabelaSelecao ;
                    clav:referencialClassificativoStatus 'H';
                    clav:designacao '${name} ${name == "Teste" ? id.replace("ts_", "") : ""}' .
        `;

    for (let clas of classes) {
        let clasID = id + '_' + clas.id.value.replace(/[^#]+#(.*)/, '$1');

        let level = clas.Codigo.value.split('.').length;

        createQuery += `
            clav:${clasID} rdf:type owl:NamedIndividual ,
                    clav:Classe_N${level} ;
                clav:status "H" ;
                clav:codigo "${clas.Codigo.value}" ;
                clav:pertenceLC clav:${id} ;
                clav:classeStatus "${clas.Status.value}" .
        `;

        if (clas.Pai) {
            createQuery += `
                clav:${clasID} clav:temPai clav:${id + '_' + clas.Pai.value.replace(/[^#]+#(.*)/, '$1')} .
            `;
        }

        var keyVal = {
            ProcTrans: 'processoTransversal',
            Descricao: 'descricao',
            Titulo: 'titulo'
        };

        for (const key in keyVal) {
            if (clas[key]) {
                createQuery += `
                    clav:${clasID} clav:${keyVal[key]} "${clas[key].value.replace(/\n|\r/g, '\\n').replace(/\"/g, "\\\"")}" .
                `;
            }
        }

        if (clas.Exemplos.value) {
            for (let val of clas.Exemplos.value.split('%%')) {
                createQuery += `
                    clav:${clasID} clav:exemploNA "${val.replace(/\n|\r/g, '\\n').replace(/\"/g, "\\\"")}" .
                `;
            }
        }

        var keyMultVal = {
            ProcTipo: 'processoTipoVC',
            Donos: 'temDono',
            Parts1: 'temParticipanteApreciador',
            Parts2: 'temParticipanteAssessor',
            Parts3: 'temParticipanteComunicador',
            Parts4: 'temParticipanteDecisor',
            Parts5: 'temParticipanteExecutor',
            Parts6: 'temParticipanteIniciador',
            Diplomas: 'temLegislacao',
        }

        for (const key in keyMultVal) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyMultVal[key]} clav:${val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }


        var keyNotes = {
            NotasA: 'temNotaAplicacao',
            NotasE: 'temNotaExclusao',
        }

        for (const key in keyNotes) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    val = val.split('::');
                    noteID = val[0].replace(/[^#]+#(n[ae]_)(.*)/, `$1${id}_$2`);

                    createQuery += `
                        clav:${noteID} rdf:type owl:NamedIndividual,
                                clav:clav:${keyNotes[key].slice(3)};
                            clav:conteudo "${val[1].replace(/\n|\r/g, '\\n').replace(/\"/g, "\\\"")}".
                        clav:${clasID} clav:${keyNotes[key]} clav:${noteID} .
                    `;
                }
            }
        }

        var keyRels = {
            Rels1: 'eSintetizadoPor',
            Rels2: 'eSinteseDe',
            Rels3: 'eComplementarDe',
            Rels4: 'eCruzadoCom',
            Rels5: 'eSuplementoPara',
            Rels6: 'eSucessorDe',
            Rels7: 'eAntecessorDe',
        }

        for (const key in keyRels) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyRels[key]} clav:${id + "_" + val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }


        if (level >= 3 && clas.DFvalor) {
            createQuery += `
                clav:pca_${clasID} rdf:type clav:PCA,
                        owl:NamedIndividual .

                clav:df_${clasID} rdf:type clav:DestinoFinal,
                        owl:NamedIndividual .

                clav:${clasID} clav:temPCA  clav:pca_${clasID} ;
                    clav:temDF clav:df_${clasID} .


                clav:just_pca_${clasID} rdf:type clav:JustificacaoPCA,
                        owl:NamedIndividual .

                clav:just_df_${clasID} rdf:type clav:JustificacaoDF,
                        owl:NamedIndividual .

                clav:pca_${clasID} clav:temJustificacao clav:just_pca_${clasID} .
                clav:df_${clasID} clav:temJustificacao clav:just_df_${clasID} .
            `;

            if (clas.PCAcontagem && clas.PCAcontagem.value) {
                createQuery += `
                    clav:pca_${clasID} clav:pcaFormaContagemNormalizada clav:${clas.PCAcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if (clas.PCAsubcontagem && clas.PCAsubcontagem.value) {
                createQuery += `
                    clav:pca_${clasID} clav:pcaSubformaContagem clav:${clas.PCAsubcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if (clas.PCAvalor && clas.PCAvalor.value) {
                createQuery += `
                    clav:pca_${clasID} clav:pcaValor '${clas.PCAvalor.value}' .
                `;
            }
            if (clas.DFvalor && clas.DFvalor.value) {
                createQuery += `
                    clav:df_${clasID} clav:dfValor '${clas.DFvalor.value}' .
                `;
            }
        }
        let critCount = {
            pca: 0,
            df: 0
        };
        let critsToRemove = [];
        for (let [critIndex, crit] of criteriaData.entries()) {
            let critID = crit.id.value.replace(/[^#]+#(.*)/, '$1');
            let pID = critID.replace(/.*(c[0-9]{3}\.[0-9]{2}.[0-9]{3}).*/, '$1');
            let critCat = critID.replace(/crit_just_([^_]*)_.*/, '$1');

            if (pID == clas.id.value.replace(/[^#]+#(.*)/, '$1')) {
                let n = critCount[critCat];
                critCount[critCat]++;

                createQuery += `
                    clav:crit_just_${critCat}_${clasID}_${n} rdf:type clav:${crit.Tipo.value.replace(/[^#]+#(.*)/, '$1')} ,
                            owl:NamedIndividual .

                    clav:just_${critCat}_${clasID} clav:temCriterio clav:crit_just_${critCat}_${clasID}_${n} .
                `;

                if (crit.Conteudo.value) {
                    createQuery += `
                        clav:crit_just_${critCat}_${clasID}_${n} clav:conteudo "${crit.Conteudo.value.replace(/\n|\r/g, '\\n').replace(/\"/g, "\\\"")}" .
                    `;
                }
                if (crit.Legislacao.value) {
                    for (let dip of crit.Legislacao.value.split('###')) {
                        createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temLegislacao clav:${dip.replace(/[^#]+#(.*)/, '$1')} .
                        `;
                    }
                }
                if (crit.Processos.value) {
                    for (let proc of crit.Processos.value.split('###')) {
                        createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temProcessoRelacionado clav:${proc.replace(/[^#]+#(.*)/, '$1')} .
                        `;
                    }
                }
                critsToRemove.push(critIndex);
            }
        }
    }

    createQuery += "}"

    return execQuery("update", createQuery)
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}

SelTabs.deleteTab = function (id) {
    var delQuery = `
        DELETE {
            clav:${id} clav:status ?status .
        }
        INSERT {
            clav:${id} clav:status 'I' .
        }
        WHERE {
            clav:${id} clav:status ?status .
        }
    `;

    return execQuery("update", delQuery)
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.trueDelete = function (id) {
    var delQuery = `
        DELETE {
            clav:${id} ?s1 ?p1 .
            ?classe ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
        WHERE {
            clav:${id} ?s1 ?p1 .
            ?classe clav:pertenceLC clav:${id};
                ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
    `;

    return execQuery("update", delQuery)
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}

function parseCell(cell) {
    if (cell != null) {
        var type = typeof cell

        if (type != "string") {
            if (type == "object" && cell.richText) {
                cell = cell.richText.map(e => e.text).join('')
            } else {
                cell = JSON.stringify(cell)
            }
        }
    }

    return cell
}

async function validateColumnsValues(worksheet, start, headers, typeOrg) {
    let ret = []

    //codigos
    var c = worksheet.getColumn(headers.codigos).values
    c = c.map(e => parseCell(e))

    for (let i = start; i < c.length; i++) {
        if (!/^\s*\d{3}(\.\d{2}(\.\d{3}(\.\d{2})?)?)?\s*$/g.test(c[i])) {
            throw (`Código inválido na linha ${start + i} da tabela!\nO código para ser válido deve ser, por exemplo, no seguinte formato: 100 ou 150.01 ou 200.20.002 ou 400.20.100.01`)
        }
    }

    //titulos
    c = worksheet.getColumn(headers.titulos).values
    c = c.map(e => parseCell(e))

    for (i = start; i < c.length; i++) {
        if (c[i] == null) {
            throw (`Título inválido na linha ${start + i} da tabela!`)
        }
    }

    if (typeOrg == "TS Organizacional") {
        //donos
        c = worksheet.getColumn(headers.donos).values
        c = c.map(e => parseCell(e))

        for (i = start; i < c.length; i++) {
            if (c[i] != null && !/^\s*[xX]\s*$/g.test(c[i])) {
                throw (`Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nApenas deve conter x ou X (processo selecionado) ou nada (processo não selecionado).`)
            }
        }

        //participantes
        c = worksheet.getColumn(headers.participantes).values
        c = c.map(e => parseCell(e))

        for (i = start; i < c.length; i++) {
            if (c[i] != null && !/^\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador)\s*$/g.test(c[i])) {
                throw (`Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nApenas deve conter o tipo de participação (Apreciador, Assessor, Comunicador, Decisor, Executor ou Iniciador) ou nada (processo não selecionado).`)
            }
        }
    } else if (typeOrg == "TS Pluriorganizacional") {
        let ents_tips = State.getEntidades().map(e => { return { sigla: e.sigla, designacao: e.designacao } })
        let tips = await Tipologias.listar('?estado="Ativa"')
        ents_tips.concat(tips.map(t => { return { sigla: t.sigla, designacao: t.designacao } }))

        //donos
        c = worksheet.getColumn(headers.donos).values
        c = c.map(e => parseCell(e))

        for (i = start; i < c.length; i++) {
            if (c[i] != null) {
                if (!/^\s*\w+\s*(#\s*\w+\s*)*$/g.test(c[i])) {
                    throw (`Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nApenas deve conter siglas de entidades/tipologias separadas por '#' ou nada (processo não selecionado).`)
                } else {
                    let siglas = c[i].split('#')
                    for (let sigla of siglas) {
                        sigla = sigla.replace(/\s*/g, '')
                        let aux = ents_tips.filter(e => e.sigla == sigla)

                        if (!aux.length > 0) {
                            throw (`Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nA entidade/tipologia ${sigla} não existe.`)
                        } else {
                            if (!ret.filter(e => e.sigla == sigla).length > 0) {
                                ret.push(aux[0])
                            }
                        }
                    }
                }
            }
        }

        //participantes
        let p = worksheet.getColumn(headers.participantes).values
        p = p.map(e => parseCell(e))

        for (i = start; i < p.length; i++) {
            if (p[i] != null) {
                if (!/^\s*\w+\s*(#\s*\w+\s*)*$/g.test(p[i])) {
                    throw (`Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nApenas deve conter siglas de entidades/tipologias separadas por '#' ou nada (processo não selecionado).`)
                } else {
                    let siglas = p[i].split('#')
                    for (let sigla of siglas) {
                        sigla = sigla.replace(/\s*/g, '')
                        let aux = ents_tips.filter(e => e.sigla == sigla)

                        if (!aux.length > 0) {
                            throw (`Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nA entidade/tipologia ${sigla} não existe.`)
                        } else {
                            if (!ret.filter(e => e.sigla == sigla).length > 0) {
                                ret.push(aux[0])
                            }
                        }
                    }
                }
            }
        }

        //tipo participação
        let tp = worksheet.getColumn(headers.tipo_participacao).values
        tp = tp.map(e => parseCell(e))

        for (i = start; i < tp.length; i++) {
            if (tp[i] != null && !/^\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador)\s*(#\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador)\s*)*$/g.test(tp[i])) {
                throw (`Célula inválida na linha ${i} e coluna ${headers.tipo_participacao} da tabela!\nApenas deve conter os tipos de participação (Apreciador, Assessor, Comunicador, Decisor, Executor ou Iniciador) separados por '#' ou nada (processo não selecionado).`)
            }
        }

        //match length
        if (tp.length != p.length)
            throw (`Os tamanhos das colunas 'Participante' e 'Tipo de participação' não coincidem.`)

        for (i = start; i < p.length; i++) {
            if (p[i] != null && tp[i] != null) {
                let siglas = p[i].split('#')
                let tps = tp[i].split('#')

                if (siglas.length != tps.length) {
                    throw (`As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`)
                }
            } else if (p[i] == null && tp[i] != null) {
                throw (`As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`)
            } else if (p[i] != null && tp[i] == null) {
                throw (`As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`)
            }
        }
    }

    return ret
}

function HeaderException(message, headersValid) {
    this.message = message
    this.nHeaders = headersValid
}

function validateHeaders(headers, typeOrg) {
    let codigos = -1
    let titulos = -1
    let donos = -1
    let parts = -1
    let tipPart = -1
    let ret = null
    let nFound = 0

    //typeOrg == "TS Organizacional" ou typeOrg == "TS Pluriorganizacional"
    for (let i = 1; i < headers.length; i++) {
        if (/^\s*Código\s*$/g.test(headers[i])) {
            codigos = i
        } else if (/^\s*Título\s*$/g.test(headers[i])) {
            titulos = i
        } else if (/Dono/g.test(headers[i])) {
            donos = i
        } else if (/Participante/g.test(headers[i])) {
            parts = i
        } else if (/^\s*Tipo de participação\s*$/g.test(headers[i])) {
            tipPart = i
        }
    }

    if (codigos != -1) nFound++
    if (titulos != -1) nFound++
    if (donos != -1) nFound++
    if (parts != -1) nFound++
    if (typeOrg == "TS Pluriorganizacional" && tipPart != -1) nFound++

    if (codigos == -1) throw new HeaderException("Não foi possível encontrar a coluna dos códigos.", nFound)
    if (titulos == -1) throw new HeaderException("Não foi possível encontrar a coluna dos títulos.", nFound)
    if (donos == -1) throw new HeaderException("Não foi possível encontrar a coluna 'Dono'.", nFound)
    if (parts == -1) throw new HeaderException("Não foi possível encontrar a coluna 'Participante'.", nFound)

    if (typeOrg == "TS Organizacional") {
        ret = {
            codigos: codigos,
            titulos: titulos,
            donos: donos,
            participantes: parts
        }
    } else if (typeOrg == "TS Pluriorganizacional") {
        if (tipPart == -1) {
            throw new HeaderException("Não foi possível encontrar a coluna 'Tipo de participação'.", nFound)
        }

        ret = {
            codigos: codigos,
            titulos: titulos,
            donos: donos,
            participantes: parts,
            tipo_participacao: tipPart
        }
    }

    return ret
}

//Descobrir onde está a tabela de onde se obtém os valores
async function findSheet(workbook, typeOrg) {
    var sheetN = null
    var rowHeaderN = null
    var founded = false
    var ents_tips = []
    let headersPos = {}
    let error = ""
    let nSuc = 0

    for (let i = 0; i < workbook.worksheets.length; i++) {
        let worksheet = workbook.worksheets[i]
        var rC = worksheet.rowCount

        if (!founded && rC > 0 && worksheet.state == 'visible') {
            for (let j = 1; j <= rC && !founded; j++) {
                var row = worksheet.getRow(j).values
                row = row.map(e => parseCell(e))

                try {
                    headersPos = validateHeaders(row, typeOrg)
                    founded = true
                    sheetN = i
                    rowHeaderN = j
                } catch (e) {
                    if (e.nHeaders > nSuc) {
                        error = e.message
                        nSuc = e.nHeaders
                    }
                }
            }
        }
    }

    if (error != "") throw ("Não foi encontrada a TS: " + error)

    if (founded) {
        try {
            ents_tips = await validateColumnsValues(workbook.worksheets[sheetN], rowHeaderN + 1, headersPos, typeOrg)
        } catch (e) {
            throw ("A TS não se encontra no formato correto: " + e)
        }
    }

    return [sheetN, rowHeaderN, headersPos, ents_tips]
}

function constructTSO(worksheet, columns, start, obj, stats) {
    for (var i = start + 1; i <= worksheet.rowCount; i++) {
        var row = worksheet.getRow(i).values
        var p = {}

        if (/^\s*[xX]\s*$/g.test(parseCell(row[columns.donos]))) {
            p.dono = true
            stats.donos++
        } else {
            p.dono = false
        }

        let tipPart = parseCell(row[columns.participantes])
        if (tipPart) {
            tipPart = tipPart.replace(/\s*/g, "")
            p.participante = tipPart
            stats.participantes++
        } else {
            p.participante = "NP"
        }

        if (p.dono || p.participante != "NP") {
            p.codigo = parseCell(row[columns.codigos]).replace(/\s*/g, "")
            p.titulo = parseCell(row[columns.titulos]).replace(/^\s*(\S.*\S)\s*$/g, "$1")

            stats.processos++
            obj.push(p)
        }
    }
}

function constructTSP(worksheet, columns, start, obj, stats) {
    for (var i = start + 1; i <= worksheet.rowCount; i++) {
        var row = worksheet.getRow(i).values
        var p = {
            entidades: []
        }

        let donos = parseCell(row[columns.donos])
        if (donos != null) {
            donos = donos.split('#')
            for (let dono of donos) {
                var index = -1
                dono = dono.replace(/\s*/g, "")

                for (var w = 0; w < p.entidades.length && index == -1; w++) {
                    if (p.entidades[w].sigla == dono) {
                        index = w
                    }
                }

                if (index == -1) {
                    index = p.entidades.length
                    p.entidades.push({ sigla: dono })
                }

                p.entidades[index].dono = true
                p.entidades[index].participante = "NP"
                stats[dono].donos++
            }
        }

        let parts = parseCell(row[columns.participantes])
        if (parts != null) {
            parts = parts.split('#')
            let tipo_part = parseCell(row[columns.tipo_participacao]).split('#')

            for (let j = 0; j < parts.length; j++) {
                var index = -1
                parts[j] = parts[j].replace(/\s*/g, "")
                tipo_part[j] = tipo_part[j].replace(/\s*/g, "")

                for (var w = 0; w < p.entidades.length && index == -1; w++) {
                    if (p.entidades[w].sigla == parts[j]) {
                        index = w
                    }
                }

                if (index == -1) {
                    index = p.entidades.length
                    p.entidades.push({ sigla: parts[j] })
                }

                if (p.entidades[index].dono == null)
                    p.entidades[index].dono = false

                p.entidades[index].participante = tipo_part[j]
                stats[parts[j]].participantes++
            }
        }

        if (p.entidades.length > 0) {
            p.codigo = parseCell(row[columns.codigos]).replace(/\s*/g, "")
            p.titulo = parseCell(row[columns.titulos]).replace(/^\s*(\S.*\S)\s*$/g, "$1")
            p.edited = true

            for (var w = 0; w < p.entidades.length; w++) {
                stats[p.entidades[w].sigla].processos++
            }

            obj.push(p)
        }
    }
}

SelTabs.criarPedidoDoCSV = async function (workbook, email, entidade_user, entidade_ts, tipo_ts, designacao) {
    var aux = await findSheet(workbook, tipo_ts)
    var sheetN = aux[0]
    var rowHeaderN = aux[1]
    var columns = aux[2]
    var ents_tips = aux[3]

    var worksheet = workbook.worksheets[sheetN]
    var obj = {}
    var stats = {}
    var list = []

    if (tipo_ts == "TS Organizacional") {
        stats = {
            processos: 0,
            donos: 0,
            participantes: 0
        }

        constructTSO(worksheet, columns, rowHeaderN, list, stats)
        obj.ts = {
            designacao: designacao,
            processos: list,
            entidade: entidade_ts
        }
    } else {
        obj.entidades = []
        ents_tips.forEach(e => {
            stats[e.sigla] = {
                processos: 0,
                donos: 0,
                participantes: 0
            }

            obj.entidades.push({
                sigla: e.sigla,
                designacao: e.designacao,
                label: e.sigla + " - " + e.designacao
            })
        })

        constructTSP(worksheet, columns, rowHeaderN, list, stats)
        obj.designacao = designacao
        obj.listaProcessos = {
            procs: list
        }
    }

    var pedido = {
        tipoPedido: "Criação",
        tipoObjeto: tipo_ts,
        novoObjeto: obj,
        user: { email: email },
        //Adiciona a entidade do utilizador criador do pedido
        entidade: entidade_user
    }

    var pedido = await Pedidos.criar(pedido)
    return { codigo: pedido, stats: stats }
}

function queryClasse(id, proc) {
    const nanoid = require('nanoid')
    var idProc = "c" + proc.codigo + "_" + id

    var query = ""
    query += `
        clav:${idProc} a clav:Classe_N${proc.codigo.split(".").length} ;
                       clav:pertenceTS clav:${id} ;
                       clav:classeStatus "${proc.status}" ;
                       clav:codigo "${proc.codigo}" ;
                       clav:titulo "${proc.titulo}" ;
                       clav:descricao "${proc.descricao.replace(/"/g, '\"')}" .
    `
    if (proc.procTrans)
        query += `
            clav:${idProc} clav:processoTransversal "${proc.procTrans}" .
        `
    if (proc.tipoProc == "Processo Comum")
        query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pc .
        `
    else
        query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pe .
        `

    for (var nota of proc.notasAp) {
        const nano = nanoid();
        var notaId = "na_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temNotaAplicacao clav:${notaId} .
            clav:${notaId} a clav:NotaAplicacao ;
                        clav:conteudo "${nota.nota.replace(/"/g, '\\"')}" .
        `
    }

    for (var nota of proc.exemplosNotasAp) {
        const nano = nanoid();
        var notaId = "exna_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temExemploNA clav:${notaId} .
            clav:${notaId} a clav:ExemploNotaAplicacao ;
                        clav:conteudo "${nota.exemplo.replace(/"/g, '\\"')}" .
        `
    }

    for (var nota of proc.notasEx) {
        const nano = nanoid();
        var notaId = "ne_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temNotaExclusao clav:${notaId} .
            clav:${notaId} a clav:NotaExclusao ;
                        clav:conteudo "${nota.nota.replace(/"/g, '\\"')}" .
        `
    }

    for (var ti of proc.termosInd) {
        const nano = nanoid();
        var tiId = "ti_" + nano;
        query += `
            clav:${tiId} a clav:TermoIndice ;
                         clav:estado "Ativo" ;
                         clav:termo "${ti.termo}" ;
                         clav:estaAssocClasse clav:${idProc} .
        `
    }

    for (var leg of proc.legislacao)
        query += `
            clav:${idProc} clav:temLegislacao clav:${leg.idLeg} .
        `

    if (proc.pca.valores != "" || proc.pca.notas != "") {
        var pcaId = "pca_" + idProc
        query += `
            clav:${idProc} clav:temPCA clav:${pcaId} .
            clav:${pcaId} a clav:PCA ;
                        clav:pcaValor "${!isNaN(proc.pca.valores) ? proc.pca.valores : 'NE'}" .
        `
        if (proc.pca.formaContagem == "Data de cessação da vigência")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_cessacaoVigencia .
            `
        else if (proc.pca.formaContagem == "Data de conclusão do procedimento")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_conclusaoProcedimento .
            `
        else if (proc.pca.formaContagem == "Conforme disposição legal") {
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_disposicaoLegal .
            `
            if (proc.pca.subFormaContagem == "Data do último assento, respeitando 30 anos para o óbito, 50 anos para o casamento e 100 anos para o nascimento, nos termos do artigo 15.º da Lei n.º 324/2007")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.01 .
                `
            else if (proc.pca.subFormaContagem == "Data do cumprimento nos termos do artigo 26.º da Lei n.º 5/2008")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.02 .
                `
            else if (proc.pca.subFormaContagem == "Data da defesa da tese de doutoramento, nos termos do artigo 3.º do Decreto-Lei n.º 52/2002 ou da data do cancelamento prevista no n.º 5 do artigo 5.º da Portaria n.º 285/2015")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.03 .
                `
            else if (proc.pca.subFormaContagem == "Data do facto que ocorrer em primeiro lugar; a) com o registo da extinção da procuração a que digam respeito; b) decorridos 15 anos a contar da data da outorga da procuração; c) logo que deixem de ser estritamente necessários para os fins para que foram recolhidos, nos termos do n.º 1 do artigo 13.º do Decreto Regulamentar n.º 3/2009")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.04 .
                `
            else if (proc.pca.subFormaContagem == "Data em que a autorização de introdução no mercado deixe de existir, nos termos do n.º 2 do artigo 12.º do Regulamento de execução (UE) n.º 520/2012")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.05 .
                `
            else if (proc.pca.subFormaContagem == 'Data da prescrição do procedimento criminal para os inquéritos arquivados nos termos do n.º 2 do artigo 277.º, do n.º 3 do artigo 282.º e do n.º 1 do artigo 277.º do Decreto-Lei n.º 78/87 atualizado e para os inquéritos arquivados com fundamento na recolha de "prova bastante de se não ter verificado o crime", ou "de o arguido não o ter praticado a qualquer título"; data do arquivamento para os inquéritos arquivados com fundamento na inadmissibilidade do procedimento ou outro, nos termos do n.º 1 do artigo 277.º e do n.º 1 do artigo 280.º do Decreto-Lei n.º 78/87 atualizado."')
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.06 .
                `
            else if (proc.pca.subFormaContagem == "Data em que os jovens a quem respeitam completarem 21 anos, nos termos do artigo 132.º da Lei n.º 166/99")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.07 .
                `
            else if (proc.pca.subFormaContagem == "Data da prescrição do procedimento criminal, nos termos do artigo 118.º do Decreto-Lei n.º 48/95")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.08 .
                `
            else if (proc.pca.subFormaContagem == "Data em que forem considerados findos para efeitos de arquivo, nos termos do artigo 142.º da Lei n.º 63/2013")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.09 .
                `
            else if (proc.pca.subFormaContagem == "Data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.10 .
                `
            else if (proc.pca.subFormaContagem == "Data em que o jovem atinja a maioridade ou, nos casos em que tenha solicitado a continuação da medida para além da maioridade, complete 21 anos ou até aos 25 anos de idade, nos termos da Lei n.º 147/99, alterada pela Lei n.º 23/2017")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.11 .
                `
            else if (proc.pca.subFormaContagem == 'Maior de idade: data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015; Menor de idade: data em que o respectivo titular completar 21 anos, nos termos do artigo 220.º da Lei n.º 4/2015" - Sempre que as formas de contagem de prazos estipuladas nas alíneas c) e e) do n.º 6 não forem aplicáveis, por o título não ser emitido ou por não se iniciar o período de vigência, compete às entidades previstas no artigo 2.º proceder ao encerramento das agregações, em conformidade com o código do procedimento administrativo, dando início à contagem do prazo de conservação administrativa')
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.12 .
                `
        }
        else if (proc.pca.formaContagem == "Data de emissão do título")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_emissaoTitulo .
            `
        else if (proc.pca.formaContagem == "Data de extinção do direito")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_extincaoDireito .
            `
        else if (proc.pca.formaContagem == "Data de extinção da entidade sobre a qual recai o procedimento")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_extincaoEntidade .
            `
        else if (proc.pca.formaContagem == "Data de início do procedimento")
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_inicioProcedimento .
            `

        if (proc.pca.nota)
            query += `
                clav:${pcaId} clav:pcaNota clav:${proc.pca.nota} .
            `
        if (proc.pca.justificacao)
            query += `
                clav:${pcaId} clav:temJustificacao clav:just_${pcaId} .
                clav:just_${pcaId} a clav:JustificacaoPCA .
            `
        var justIndex = 1;
        for (var just of proc.pca.justificacao) {
            query += `
                clav:just_${pcaId} clav:temCriterio clav:crit_just_${pcaId}_${justIndex} .
                clav:crit_just_${pcaId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(/"/g, '\\"')}" .
            `
            justIndex++;
        }
    }
    if ((proc.df.valor != "" && proc.df.valor != "NE") || proc.df.nota) {
        var dfId = "df_" + idProc
        query += `
            clav:${idProc} clav:temDF clav:${dfId} .
            clav:${dfId} a clav:DestinoFinal ;
                        clav:dfValor "${proc.df.valor}" .
        `
        if (proc.df.justificacao)
            query += `
                clav:${dfId} clav:temJustificacao clav:just_${dfId} .
                clav:just_${dfId} a clav:JustificacaoDF .
            `
        justIndex = 1;
        for (var just of proc.df.justificacao) {
            query += `
                clav:just_${dfId} clav:temCriterio clav:crit_just_${dfId}_${justIndex} .
                clav:crit_just_${dfId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(/"/g, '\\"')}" .
            `
            justIndex++;
        }

    }
    if (proc.codigo.split('.').length == 4)
        query += `
            clav:${idProc} clav:temPai clav:${"c" + proc.codigo.split('.')[0] + '.' + proc.codigo.split('.')[1] + '.' + proc.codigo.split('.')[2] + "_ts" + idProc.split("_ts")[1]} .
        `
    if (proc.codigo.split('.').length == 3)
        query += `
            clav:${idProc} clav:temPai clav:${"c" + proc.codigo.split('.')[0] + '.' + proc.codigo.split('.')[1] + "_ts" + idProc.split("_ts")[1]} .
        `
    if (proc.codigo.split('.').length == 2)
        query += `
            clav:${idProc} clav:temPai clav:${"c" + proc.codigo.split('.')[0] + "_ts" + idProc.split("_ts")[1]} .
        `

    return query
}

SelTabs.adicionar = async function (tabela) {
    var currentTime = new Date();
    var paiList = [];
    var queryNum = `
        select * where {
            ?ts a clav:TabelaSelecao .
        }
    `
    try {
        let resultNum = await execQuery("query", queryNum);
        resultNum = normalize(resultNum)
        var num = resultNum.length == 0 ? "1" : (parseInt(resultNum[resultNum.length - 1].ts.split("ts")[1]) + 1)
        var id = "ts" + num
        var data = currentTime.getFullYear() + "-" + (currentTime.getMonth() + 1) + "-" + currentTime.getDate()
        var entID = ""
        if (tabela.objeto.tipo.includes('TS Pluri')) {


            var query = `{
            clav:${id} a clav:TabelaSelecao ;
                          clav:designacao "${tabela.objeto.dados.designacao}" ;
                          clav:tsResponsavel "${tabela.criadoPor}" ;
                          clav:dataAprovacao "${data}" ;
                          clav:temEntidadeResponsavel clav:${tabela.entidade} .
        `

            for (var ent of tabela.objeto.dados.entidades)
                query += `
                clav:${id} clav:temEntidade clav:${ent.id} .
            `

            for (var proc of tabela.objeto.dados.listaProcessos.procs) {
                //Escreve os triplos do proc
                query += queryClasse(id, proc)

                var idProc = "c" + proc.codigo + "_" + id
                for (var processo of proc.processosRelacionados) {
                    if (tabela.objeto.dados.listaProcessos.procs.find(e => e.codigo == processo.codigo)) {
                        var idProcAux = "c" + processo.codigo + "_" + id
                        query += `
                        clav:${idProc} clav:${processo.idRel} clav:${idProcAux} .
                    `
                    }
                }
                //Definição de participação das entidades
                for (var ent of proc.entidades) {
                    if (ent.dono)
                        query += `
                        clav:${idProc} clav:temDono clav:${ent.id} .
                        clav:c${proc.codigo} clav:temDono clav:${ent.id} .
                    `

                    if (ent.participante != "NP")
                        query += `
                        clav:${idProc} clav:temParticipante${ent.participante} clav:${ent.id} .
                        clav:c${proc.codigo} clav:temParticipante${ent.participante} clav:${ent.id} .
                    `
                }
                //Adiciona à lista de pais com nivel N1
                if (paiList.indexOf(proc.codigo.split(".")[0]) === -1)
                    paiList.push(proc.codigo.split(".")[0])
                //Adiciona à lista de pois com nivel N2
                if (paiList.indexOf(proc.codigo.split(".")[0] + "." + proc.codigo.split(".")[1]) === -1)
                    paiList.push(proc.codigo.split(".")[0] + "." + proc.codigo.split(".")[1])
                //Adicona à lista os filhos
                var listaFilhos = await Classe.descendencia("c" + proc.codigo)
                //Escreve os triplos dos proc filhos
                for (var filho of listaFilhos) {
                    var classeFilho = await Classe.retrieve("c" + filho.codigo)
                    query += queryClasse(id, classeFilho)
                }
            }
            //Escreve os triplos dos proc pais
            for (var pai of paiList) {
                var classePai = await Classe.retrieve("c" + pai)
                query += queryClasse(id, classePai)
            }
            query += `
        }
        `
        }
        else {

            var query = `{
                clav:${id} a clav:TabelaSelecao ;
                              clav:designacao "${tabela.objeto.dados.ts.designacao}" ;
                              clav:tsResponsavel "${tabela.criadoPor}" ;
                              clav:dataAprovacao "${data}" ;
                              clav:temEntidadeResponsavel clav:${tabela.entidade} .
            `
            if (tabela.objeto.dados.ts.idEntidade)
                entID = tabela.objeto.dados.ts.idEntidade


            else if (tabela.objeto.dados.ts.idTipologia)
                entID = tabela.objeto.dados.ts.idTipologia

            query += `
                    clav:${id} clav:temEntidade clav:${entID} .
                `

            for (var proc of tabela.objeto.dados.ts.listaProcessos.procs) {
                //Escreve os triplos do proc

                query += queryClasse(id, proc)

                var idProc = "c" + proc.codigo + "_" + id
                for (var processo of proc.processosRelacionados) {

                    if (tabela.objeto.dados.ts.listaProcessos.procs.find(e => e.codigo == processo.codigo)) {
                        var idProcAux = "c" + processo.codigo + "_" + id
                        query += `
                            clav:${idProc} clav:${processo.idRel} clav:${idProcAux} .
                        `
                    }
                }
                //Definição de participação das entidades

                if (proc.dono)
                    query += `
                            clav:${idProc} clav:temDono clav:${entID} .
                            clav:c${proc.codigo} clav:temDono clav:${entID} .
                        `

                if (proc.participante != "NP")
                    query += `
                            clav:${idProc} clav:temParticipante${proc.participante} clav:${entID} .
                            clav:c${proc.codigo} clav:temParticipante${proc.participante} clav:${entID} .
                        `

                //Adiciona à lista de pais com nivel N1
                if (paiList.indexOf(proc.codigo.split(".")[0]) === -1)
                    paiList.push(proc.codigo.split(".")[0])
                //Adiciona à lista de pois com nivel N2
                if (paiList.indexOf(proc.codigo.split(".")[0] + "." + proc.codigo.split(".")[1]) === -1)
                    paiList.push(proc.codigo.split(".")[0] + "." + proc.codigo.split(".")[1])
                //Adicona à lista os filhos
                var listaFilhos = await Classe.descendencia("c" + proc.codigo)
                //Escreve os triplos dos proc filhos
                for (var filho of listaFilhos) {
                    var classeFilho = await Classe.retrieve("c" + filho.codigo)
                    query += queryClasse(id, classeFilho)
                }
            }
            //Escreve os triplos dos proc pais
            for (var pai of paiList) {
                var classePai = await Classe.retrieve("c" + pai)
                query += queryClasse(id, classePai)
            }
            query += `
            }
            `
        }

        var inserir = "INSERT DATA " + query;

        var ask = `ASK {
            clav:${id} a clav:TabelaSelecao ;
                clav:tsResponsavel "${tabela.criadoPor}" ;
                clav:dataAprovacao "${data}" ;
                clav:temEntidadeResponsavel clav:${tabela.entidade} .
            }
        `;


        return execQuery("update", inserir).then(res =>
            execQuery("query", ask).then(result => {
                if (result.boolean) return "Sucesso na inserção da tabela de seleção";
                else {
                    execQuery("delete", "DELETE DATA " + query)
                    throw "Insucesso na inserção do tabela de seleção";
                }
            })
        );

    } catch (erro) { throw (erro); }

}
