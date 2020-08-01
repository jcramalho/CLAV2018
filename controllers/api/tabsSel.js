const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
var Pedidos = require('../../controllers/api/pedidos');
const { pca } = require('./classes');
var Classe = require('../../controllers/api/classes')
var SelTabs = module.exports

const requisitosFicheiro = "O ficheiro tem de:<ul><li>Possuir uma sheet em que na 1º coluna tenha como header 'Código' e por baixo os códigos dos processos</li><li>Na mesma linha da header 'Código' possuir:<ul><li>Possuir no máximo uma coluna 'Título'</li><li>Pelo menos uma coluna começada por 'Dono' ou 'Participante', no máximo uma de cada (TS Organizacional)</li><li>Pelo menos uma coluna do tipo 'Entidade Dono' ou 'Entidade Participante', no máximo uma de cada para cada entidade (TS Pluriorganizacional)</li><li>Por baixo de cada coluna deve estar:<ul><li>x ou X os processos selecionados</li><li>Nada para os processos não selecionados</li></ul></li></ul></li></ul>"

SelTabs.list = function () {
    return execQuery("query",
        `SELECT * WHERE { 
            ?id rdf:type clav:TabelaSelecao ;
                clav:designacao ?Name ;
                clav:referencialClassificativoStatus 'A';
        }`
    )
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
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
                    clav:designacao '${name} ${name=="Teste" ? id.replace("ts_", "") : ""}' .
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
                    clav:${clasID} clav:${keyVal[key]} "${clas[key].value.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                `;
            }
        }

        if (clas.Exemplos.value) {
            for (let val of clas.Exemplos.value.split('%%')) {
                createQuery += `
                    clav:${clasID} clav:exemploNA "${val.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
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
                            clav:conteudo "${val[1].replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}".
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


        if(level>=3 && clas.DFvalor){
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

            if(clas.PCAcontagem && clas.PCAcontagem.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaFormaContagemNormalizada clav:${clas.PCAcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if(clas.PCAsubcontagem && clas.PCAsubcontagem.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaSubformaContagem clav:${clas.PCAsubcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if(clas.PCAvalor && clas.PCAvalor.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaValor '${clas.PCAvalor.value}' .
                `;
            }
            if(clas.DFvalor && clas.DFvalor.value){
                createQuery+= `
                    clav:df_${clasID} clav:dfValor '${clas.DFvalor.value}' .
                `;
            }
        }
        let critCount={
            pca:0,
            df:0   
        };
        let critsToRemove = [];
        for(let [critIndex,crit] of criteriaData.entries()){
            let critID = crit.id.value.replace(/[^#]+#(.*)/, '$1');
            let pID = critID.replace(/.*(c[0-9]{3}\.[0-9]{2}.[0-9]{3}).*/,'$1');
            let critCat = critID.replace(/crit_just_([^_]*)_.*/,'$1');

            if(pID == clas.id.value.replace(/[^#]+#(.*)/, '$1')){
                let n = critCount[critCat];
                critCount[critCat]++;

                createQuery += `
                    clav:crit_just_${critCat}_${clasID}_${n} rdf:type clav:${crit.Tipo.value.replace(/[^#]+#(.*)/, '$1')} ,
                            owl:NamedIndividual .

                    clav:just_${critCat}_${clasID} clav:temCriterio clav:crit_just_${critCat}_${clasID}_${n} .
                `;
                
                if(crit.Conteudo.value){
                    createQuery += `
                        clav:crit_just_${critCat}_${clasID}_${n} clav:conteudo "${crit.Conteudo.value.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                    `;
                }
                if(crit.Legislacao.value){
                    for(let dip of crit.Legislacao.value.split('###')){
                        createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temLegislacao clav:${dip.replace(/[^#]+#(.*)/, '$1')} .
                        `;
                    }
                }
                if(crit.Processos.value){
                    for(let proc of crit.Processos.value.split('###')){
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

function parseCell(cell){
    if(cell != null){
        var type = typeof cell

        if(type != "string"){
            if(type == "object" && cell.richText){
                cell = cell.richText.map(e => e.text).join('')
            }else{
                cell = JSON.stringify(cell)
            }
        }
    }

    return cell
}

function onlyHasXsOrNulls(worksheet, row, start){
    var len = row.length

    for(var i=2; i < len; i++){
        if(/Dono|Participante/g.test(row[i])){
            var c = worksheet.getColumn(i).values
            c = c.map(e => parseCell(e))
            var cLen = c.length
            
            for(var j=start; j < cLen; j++){
                if(c[j] != null && !/^\s*[xX]\s*$/g.test(c[j])){
                    throw(`Célula inválida na linha ${j} e coluna ${i} da tabela!\nApenas deve conter x ou X (processo selecionado) ou nada (processo não selecionado).`)
                }
            }
        }
    }

    return true
}

function onlyCodigos(codigos, start){
    var len = codigos.length

    for(var i = 0; i < len; i++){
        if(!/^\s*\d{3}(\.\d{2}(\.\d{3}(\.\d{2})?)?)?\s*$/g.test(codigos[i])){
            throw(`Código inválido na linha ${start+i} da tabela!\nO código para ser válido deve ser, por exemplo, no seguinte formato: 100 ou 150.01 ou 200.20.002 ou 400.20.100.01`)
        }
    }

    return true
}

//Descobrir onde está a tabela de onde se obtém os valores
function findSheet(workbook){
    var sheetN = null
    var rowHeaderN = null
    var founded = false

    workbook.eachSheet((worksheet, sheetId) => {
        var rC = worksheet.rowCount

        if(!founded && rC > 0 && worksheet.state == 'visible'){
            for(var j=1; j <= rC && !founded; j++){
                var row = worksheet.getRow(j).values
                row = row.map(e => parseCell(e))

                if(row[1] == 'Código'){
                    var codigos = worksheet.getColumn(1).values
                    codigos.splice(0,j+1)
                    codigos = codigos.map(e => parseCell(e))

                    if(onlyCodigos(codigos, j+1) && onlyHasXsOrNulls(worksheet, row, j+1)){
                        sheetN = sheetId
                        rowHeaderN = j
                        founded = true
                    }
                }
            }
        }
    })

    return [sheetN, rowHeaderN, founded]
}

function checkHeaders(typeOrg, columns){
    if(typeOrg == "TS Organizacional"){
        var ent = {
            donos: 0,
            participantes: 0
        }

        for(var i = 0; i < columns.length && typeOrg != null; i++){
            //garante que não há colunas de entidades
            if(columns[i].entidade == null){
                ent[columns[i].type + 's']++
            }else{
                typeOrg = null
            }
        }

        if(ent.donos > 1 || ent.participantes > 1){
            //logo não é válido porque só deve haver no máximo uma coluna Dono e outra Participante
            typeOrg = null
        }
    }else if(typeOrg == "TS Pluriorganizacional"){
        var ents = {}

        for(var i = 0; i < columns.length && typeOrg != null; i++){
            //garante que as colunas são de entidades
            if(columns[i].entidade != null){
                if(!ents[columns[i].entidade]){
                    ents[columns[i].entidade] = {
                        donos: 0,
                        participantes: 0
                    }
                }
                ents[columns[i].entidade][columns[i].type + 's']++
            }else{
                typeOrg = null
            }
        }

        if(typeOrg != null){
            for(var k in ents){
                if(ents[k].donos > 1 || ents[k].participantes > 1){
                    //logo não é válido para cada entidade só deve haver no máximo uma coluna Dono e outra Participante
                    typeOrg = null
                }           
            }
        }
    }

    return typeOrg
}

function parseHeaders(worksheet, rowHeaderN, columns, entidades){
    var headers = worksheet.getRow(rowHeaderN).values
    headers = headers.map(e => parseCell(e))
    var typeOrg = null
    var titulos = []

    for(var i = 2; i < headers.length; i++){
        if(headers[i].startsWith('Dono')){

            typeOrg = "TS Organizacional"
            columns.push({type: "dono", value: i})

        }else if(headers[i].startsWith('Participante')){

            typeOrg = "TS Organizacional"
            columns.push({type: "participante", value: i})

        }else if(headers[i].includes('Dono')){

            typeOrg = "TS Pluriorganizacional"
            var entidade = headers[i].split(' Dono')[0]
            columns.push({type: "dono", entidade: entidade, value: i})

            if(entidades.indexOf(entidade) == -1){
                entidades.push(entidade)
            }

        }else if(headers[i].includes('Participante')){

            typeOrg = "TS Pluriorganizacional"
            var entidade = headers[i].split(' Participante')[0]
            columns.push({type: "participante", entidade: entidade, value: i})

            if(entidades.indexOf(entidade) == -1){
                entidades.push(entidade)
            }
        }else if(headers[i] == "Título"){
            titulos.push(i)
        }
    }

    switch(titulos.length){
        case 0:
            titulos = null
            break
        case 1:
            titulos = titulos[0]
            break
        default:
            titulos = titulos.length
            typeOrg = null
            break
    }

    typeOrg = checkHeaders(typeOrg, columns)

    return [typeOrg, titulos]
}

function constructTSO(worksheet, columns, codigos, titulos, start, obj, stats){
    var cLen = columns.length

    for(var i = start + 1; i <= worksheet.rowCount; i++){
        var row = worksheet.getRow(i).values
        var p = {}

        for(var j=0; j < cLen; j++){
            var type = columns[j].type

            if(/^\s*[xX]\s*$/g.test(parseCell(row[columns[j].value]))){
                p[type] = true
                stats[type + 's']++
            }else{
                p[type] = false
            }
        }

        if(p.dono || p.participante){
            p.codigo = codigos[i].replace(/\s*/g,"")
            
            if(titulos != null){
                if(titulos[i] != null){
                    p.titulo = titulos[i].replace(/^\s*(\S.*\S)\s*$/g,"$1")
                }else{
                    p.titulo = ''
                }
            }

            stats.processos++
            obj.push(p)
        }
    }
}

function constructTSP(worksheet, columns, codigos, titulos, start, obj, stats){
    var cLen = columns.length

    for(var i = start + 1; i <= worksheet.rowCount; i++){
        var row = worksheet.getRow(i).values
        var p = {
            entidades: []
        }

        for(var j=0; j < cLen; j++){
            var type = columns[j].type
            var entidade = columns[j].entidade
            var nEnts = p.entidades.length

            var index = -1
            for(var w = 0; w < nEnts; w++){
                if(p.entidades[w].sigla == entidade){
                    index = w
                }
            }

            if(index == -1){
                p.entidades.push({sigla: entidade})
                index = nEnts
            }

            if(/^\s*[xX]\s*$/g.test(parseCell(row[columns[j].value]))){
                p.entidades[index][type] = true
                stats[entidade][type + 's']++
            }else{
                p.entidades[index][type] = false
            }
        }

        var aux = []
        for(var w =0; w < p.entidades.length; w++){
            if(p.entidades[w].dono || p.entidades[w].participante){
                aux.push(p.entidades[w])
            }
        }
        p.entidades = aux

        if(p.entidades.length > 0){
            p.codigo = codigos[i].replace(/\s*/g,"")
            
            if(titulos != null){
                if(titulos[i] != null){
                    p.titulo = titulos[i].replace(/^\s*(\S.*\S)\s*$/g,"$1")
                }else{
                    p.titulo = ''
                }
            }
            
            for(var w = 0; w < p.entidades.length; w++){
                stats[p.entidades[w].sigla].processos++
            }

            obj.push(p)
        }
    }
}

SelTabs.criarPedidoDoCSV = async function (workbook, email, entidade_user, entidade_ts, tipo_ts) {
    var aux = findSheet(workbook)
    var sheetN = aux[0]
    var rowHeaderN = aux[1]
    var founded = aux[2]

    if(founded){
        var worksheet = workbook.getWorksheet(sheetN)
        var columns = [] 
        var entidades = []

        aux = parseHeaders(worksheet, rowHeaderN, columns, entidades)
        var typeOrg = aux[0]
        var cTitulos = aux[1]

        if(typeOrg != null){
            if(tipo_ts == typeOrg){ 
                var obj
                var stats = {}

                if(typeOrg == "TS Organizacional"){
                    stats = {
                        processos: 0,
                        donos: 0,
                        participantes: 0
                    }
                }else{

                    entidades.forEach(e => {
                        stats[e] = {
                            processos: 0,
                            donos: 0,
                            participantes: 0
                        }
                    })
                }

                var codigos = worksheet.getColumn(1).values
                codigos = codigos.map(e => parseCell(e))

                var titulos = null
                if(cTitulos != null){
                    titulos = worksheet.getColumn(cTitulos).values
                    titulos = titulos.map(e => parseCell(e))
                }

                if(typeOrg == "TS Organizacional"){
                    var list = [] 
                    constructTSO(worksheet, columns, codigos, titulos, rowHeaderN, list, stats)
                    obj = {
                        processos: list,
                        entidade: entidade_ts
                    }
                }else{
                    obj = []
                    constructTSP(worksheet, columns, codigos, titulos, rowHeaderN, obj, stats)
                }

                var pedido = {
                    tipoPedido: "Criação",
                    tipoObjeto: typeOrg,
                    novoObjeto: {ts: obj},
                    user: {email: email},
                    //Adiciona a entidade do utilizador criador do pedido
                    entidade: entidade_user
                }

                try{
                    var pedido = await Pedidos.criar(pedido)
                    return {codigo: pedido.codigo, stats: stats}
                }catch(e){
                    throw(e)
                }
            }else{
                throw(`Tipo de Tabela de Seleção escolhida não coincide com o tipo de tabela de seleção presente no ficheiro.`)
            }
        }else{
            throw(`Não contém informação suficiente ou contém colunas a mais na linha ${rowHeaderN}.\nNão é possível distinguir se é TS Organizacional ou TS Pluriorganizacional.\n` + requisitosFicheiro)
        }
    }else{
        throw("Não foi encontrada informação por forma a criar a tabela de seleção.\n" + requisitosFicheiro)
    }
}

function queryClasse(id, proc) {
    const nanoid = require('nanoid')
    var idProc = "c" + proc.codigo +"_"+id
    console.log(idProc)
    var query = ""
    query += `
        clav:${idProc} a clav:Classe_N${proc.codigo.split(".").length} ;
                       clav:pertenceTS clav:${id} ;
                       clav:classeStatus "${proc.status}" ;
                       clav:codigo "${proc.codigo}" ;
                       clav:titulo "${proc.titulo}" ;
                       clav:descricao "${proc.descricao.replace(/"/g,'\"')}" .
    `
    if(proc.procTrans) 
        query += `
            clav:${idProc} clav:processoTransversal "${proc.procTrans}" .
        `
    if(proc.tipoProc=="Processo Comum")
        query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pc .
        `
    else 
        query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pe .
        `

    for(var nota of proc.notasAp) {
        const nano = nanoid();
        var notaId = "na_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temNotaAplicacao clav:${notaId} .
            clav:${notaId} a clav:NotaAplicacao ;
                        clav:conteudo "${nota.nota.replace(/"/g,'\\"')}" .
        `
    }

    for(var nota of proc.exemplosNotasAp) {
        const nano = nanoid();
        var notaId = "exna_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temExemploNA clav:${notaId} .
            clav:${notaId} a clav:ExemploNotaAplicacao ;
                        clav:conteudo "${nota.exemplo.replace(/"/g,'\\"')}" .
        `
    }

    for(var nota of proc.notasEx) {
        const nano = nanoid();
        var notaId = "ne_" + idProc + "_" + nano
        query += `
            clav:${idProc} clav:temNotaExclusao clav:${notaId} .
            clav:${notaId} a clav:NotaExclusao ;
                        clav:conteudo "${nota.nota.replace(/"/g,'\\"')}" .
        `
    }

    for(var ti of proc.termosInd) {
        const nano = nanoid();
        var tiId = "ti_" + nano;
        query += `
            clav:${tiId} a clav:TermoIndice ;
                         clav:estado "Ativo" ;
                         clav:termo "${ti.termo}" ;
                         clav:estaAssocClasse clav:${idProc} .
        `
    }
    
    for(var dono of proc.donos) 
        query += `
            clav:${idProc} clav:temDono clav:${dono.idDono} .
        `

    for(var part of proc.participantes) 
        query += `
            clav:${idProc} clav:temParticipante${part.participLabel} clav:${part.idParticipante} .
        `
    
    for(var leg of proc.legislacao) 
        query += `
            clav:${idProc} clav:temLegislacao clav:${leg.idLeg} .
        `
    
    if(proc.pca.valores!="" || proc.pca.notas!="") {
        var pcaId = "pca_" + idProc
        query += `
            clav:${idProc} clav:temPCA clav:${pcaId} .
            clav:${pcaId} a clav:PCA ;
                        clav:pcaValor "${!isNaN(proc.pca.valores) ? proc.pca.valores : 'NE'}" .
        `
        if(proc.pca.formaContagem == "Data de cessação da vigência") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_cessacaoVigencia .
            `
        else if(proc.pca.formaContagem == "Data de conclusão do procedimento") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_conclusaoProcedimento .
            `
        else if(proc.pca.formaContagem == "Conforme disposição legal") { 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_disposicaoLegal .
            `
            if(proc.pca.subFormaContagem == "Data do último assento, respeitando 30 anos para o óbito, 50 anos para o casamento e 100 anos para o nascimento, nos termos do artigo 15.º da Lei n.º 324/2007")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.01 .
                `
            else if(proc.pca.subFormaContagem == "Data do cumprimento nos termos do artigo 26.º da Lei n.º 5/2008")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.02 .
                `
            else if(proc.pca.subFormaContagem == "Data da defesa da tese de doutoramento, nos termos do artigo 3.º do Decreto-Lei n.º 52/2002 ou da data do cancelamento prevista no n.º 5 do artigo 5.º da Portaria n.º 285/2015")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.03 .
                `
            else if(proc.pca.subFormaContagem == "Data do facto que ocorrer em primeiro lugar; a) com o registo da extinção da procuração a que digam respeito; b) decorridos 15 anos a contar da data da outorga da procuração; c) logo que deixem de ser estritamente necessários para os fins para que foram recolhidos, nos termos do n.º 1 do artigo 13.º do Decreto Regulamentar n.º 3/2009")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.04 .
                `
            else if(proc.pca.subFormaContagem == "Data em que a autorização de introdução no mercado deixe de existir, nos termos do n.º 2 do artigo 12.º do Regulamento de execução (UE) n.º 520/2012")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.05 .
                `
            else if(proc.pca.subFormaContagem == 'Data da prescrição do procedimento criminal para os inquéritos arquivados nos termos do n.º 2 do artigo 277.º, do n.º 3 do artigo 282.º e do n.º 1 do artigo 277.º do Decreto-Lei n.º 78/87 atualizado e para os inquéritos arquivados com fundamento na recolha de "prova bastante de se não ter verificado o crime", ou "de o arguido não o ter praticado a qualquer título"; data do arquivamento para os inquéritos arquivados com fundamento na inadmissibilidade do procedimento ou outro, nos termos do n.º 1 do artigo 277.º e do n.º 1 do artigo 280.º do Decreto-Lei n.º 78/87 atualizado."')
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.06 .
                `
            else if(proc.pca.subFormaContagem == "Data em que os jovens a quem respeitam completarem 21 anos, nos termos do artigo 132.º da Lei n.º 166/99")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.07 .
                `
            else if(proc.pca.subFormaContagem == "Data da prescrição do procedimento criminal, nos termos do artigo 118.º do Decreto-Lei n.º 48/95")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.08 .
                `
            else if(proc.pca.subFormaContagem == "Data em que forem considerados findos para efeitos de arquivo, nos termos do artigo 142.º da Lei n.º 63/2013")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.09 .
                `
            else if(proc.pca.subFormaContagem == "Data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.10 .
                `
            else if(proc.pca.subFormaContagem == "Data em que o jovem atinja a maioridade ou, nos casos em que tenha solicitado a continuação da medida para além da maioridade, complete 21 anos ou até aos 25 anos de idade, nos termos da Lei n.º 147/99, alterada pela Lei n.º 23/2017")
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.11 .
                `
            else if(proc.pca.subFormaContagem == 'Maior de idade: data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015; Menor de idade: data em que o respectivo titular completar 21 anos, nos termos do artigo 220.º da Lei n.º 4/2015" - Sempre que as formas de contagem de prazos estipuladas nas alíneas c) e e) do n.º 6 não forem aplicáveis, por o título não ser emitido ou por não se iniciar o período de vigência, compete às entidades previstas no artigo 2.º proceder ao encerramento das agregações, em conformidade com o código do procedimento administrativo, dando início à contagem do prazo de conservação administrativa')
                query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.12 .
                `                           
        }
        else if(proc.pca.formaContagem == "Data de emissão do título") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_emissaoTitulo .
            `
        else if(proc.pca.formaContagem == "Data de extinção do direito") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_extincaoDireito .
            `
        else if(proc.pca.formaContagem == "Data de extinção da entidade sobre a qual recai o procedimento") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_extincaoEntidade .
            `
        else if(proc.pca.formaContagem == "Data de início do procedimento") 
            query += `
                clav:${pcaId} clav:pcaFormaContragemNormalizada clav:vc_pcaFormaContagem_inicioProcedimento .
            `
        
        if(proc.pca.nota) 
            query += `
                clav:${pcaId} clav:pcaNota clav:${proc.pca.nota} .
            `
        if(proc.pca.justificacao) 
            query += `
                clav:${pcaId} clav:temjustificacao clav:just_${pcaId} .
            `
        var justIndex = 1;
        for(var just of proc.pca.justificacao) {
            query += `
                clav:just_${pcaId} clav:temCriterio clav:crit_just_${pcaId}_${justIndex} .
                clav:crit_just_${pcaId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(/"/g,'\\"')}" .
            `
            justIndex++;
        }
    }
    if((proc.df.valor!="" && proc.df.valor!="NE") || proc.df.nota) {
        var dfId = "df_" + idProc
        query += `
            clav:${idProc} clav:temDF clav:${dfId} .
            clav:${dfId} a clav:DestinoFinal ;
                        clav:dfValor "${proc.df.valor}" .
        `
        if(proc.df.justificacao) 
            query += `
                clav:${dfId} clav:temjustificacao clav:just_${dfId} .
            `
        justIndex = 1;
        for(var just of proc.df.justificacao) {
            query += `
                clav:just_${dfId} clav:temCriterio clav:crit_just_${dfId}_${justIndex} .
                clav:crit_just_${dfId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(/"/g,'\\"')}" .
            `
            justIndex++;
        }

    }
    if(proc.codigo.split('.').length==4)
        query += `
            clav:${idProc} clav:temPai clav:${"c"+proc.codigo.split('.')[0]+'.'+proc.codigo.split('.')[1]+'.'+proc.codigo.split('.')[2]+"_ts"+idProc.split("_ts")[1]} .
        `
    if(proc.codigo.split('.').length==3)
        query += `
            clav:${idProc} clav:temPai clav:${"c"+proc.codigo.split('.')[0]+'.'+proc.codigo.split('.')[1]+"_ts"+idProc.split("_ts")[1]} .
        `
    if(proc.codigo.split('.').length==2)
        query += `
            clav:${idProc} clav:temPai clav:${"c"+proc.codigo.split('.')[0]+"_ts"+idProc.split("_ts")[1]} .
        `
    
    return query
}

SelTabs.adicionar = async function(tabela) {
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
        var num = resultNum.length == 0 ? "1" : resultNum[resultNum.length-1].ts.split("ts")[1]
        num = parseInt(num)+1
        var id = "ts"+num
        var data = currentTime.getFullYear()+"-"+(currentTime.getMonth()+1)+"-"+currentTime.getDate()

        var query = `{
            clav:${id} a clav:TabelaSelecao ;
                          clav:tsResponsavel "${tabela.criadoPor}" ;
                          clav:dataAprovacao "${data}" ;
                          clav:temEntidadeResponsavel clav:${tabela.entidade} .
        `

        for(var ent of tabela.objeto.dados.entidades)
            query += `
                clav:${id} clav:temEntidade clav:${ent.id} .
            `
        
        for(var proc of tabela.objeto.dados.listaProcessos.procs) {
            
            query += queryClasse(id, proc)
            
            var idProc = "c" + proc.codigo +"_"+id
            for(var processo of proc.processosRelacionados) {
                if(tabela.objeto.dados.listaProcessos.procs.find(e => e.codigo == processo.codigo)) {
                    var idProcAux = "c" + processo.codigo +"_"+id
                    query += `
                        clav:${idProc} clav:${processo.idRel} clav:${idProcAux} .
                    `
                }
            }

            if(paiList.indexOf(proc.codigo.split(".")[0]) === -1)
                paiList.push(proc.codigo.split(".")[0])

            if(paiList.indexOf(proc.codigo.split(".")[0]+"."+proc.codigo.split(".")[1]) === -1)
                paiList.push(proc.codigo.split(".")[0]+"."+proc.codigo.split(".")[1])
            
            var listaFilhos = await Classe.descendencia("c"+proc.codigo)
            
            for(var filho of listaFilhos) {
                var classeFilho = await Classe.retrieve("c"+filho.codigo)
                query += queryClasse(id, classeFilho) 
            }
        }

        for(var pai of paiList) {
            var classePai = await Classe.retrieve("c"+pai)
            query += queryClasse(id, classePai)
        }
        query += `
        }
        `
        var inserir = "INSERT DATA "+query;
        var ask = "ASK "+ query;
        
        return execQuery("update", inserir).then(res =>
            execQuery("query", ask).then(result => {
                if (result.boolean) return "Sucesso na inserção da tabela de seleção";
                else throw "Insucesso na inserção do tabela de seleção";
            })
        );

    } catch(erro) { throw (erro); }

}