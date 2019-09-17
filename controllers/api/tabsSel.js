const execQuery = require('../../controllers/api/utils').execQuery
const Excel = require('exceljs/modern.nodejs');
var Pedidos = require('../../controllers/api/pedidos');
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

SelTabs.criarPedidoDoCSV = async function (workbook, email, entidade) {
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
            var obj = []
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
                constructTSO(worksheet, columns, codigos, titulos, rowHeaderN, obj, stats)

            }else{
                constructTSP(worksheet, columns, codigos, titulos, rowHeaderN, obj, stats)
            }

            var pedido = {
                tipoPedido: "Criação",
                tipoObjeto: typeOrg,
                novoObjeto: obj,
                user: {email: email}
            }

            if(typeOrg == "TS Organizacional"){
                pedido.entidade = entidade
            }
           
            try{
                var pedido = await Pedidos.criar(pedido)
                return {codigo: pedido.codigo, stats: stats}
            }catch(e){
                throw(e)
            }
        }else{
            throw(`Não contém informação suficiente ou contém colunas a mais na linha ${rowHeaderN}.\nNão é possível distinguir se é TS Organizacional ou TS Pluriorganizacional.\n` + requisitosFicheiro)
        }
    }else{
        throw("Não foi encontrada informação por forma a criar a tabela de seleção.\n" + requisitosFicheiro)
    }
}
