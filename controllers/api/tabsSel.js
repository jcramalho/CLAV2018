const execQuery = require('../../controllers/api/utils').execQuery
const Excel = require('exceljs/modern.nodejs');
var Pedidos = require('../../controllers/api/pedidos');
var SelTabs = module.exports

const requisitosFicheiro = "O ficheiro tem de possuir uma sheet em que na 1º coluna tenha como header 'Código' e por baixo os códigos dos processos. Para além disso, na mesma linha da header 'Código' tem de possuir pelo menos uma coluna começada por 'Dono' ou 'Participante', no máximo uma de cada (TS Organizacional); ou uma coluna do tipo 'Entidade Dono' ou 'Entidade Participante', no máximo uma de cada para cada entidade (TS PluriOrganizacional). Por baixo de cada coluna deve estar assinalado com x ou X os processos selecionados para a coluna. Caso não possua nada significa que o processo não é selecionado."

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

function onlyHasXsOrNulls(worksheet, row, start){
    var len = row.length

    for(var i=2; i < len; i++){
        if(/Dono|Participante/g.test(row[i])){
            var c = worksheet.getColumn(i).values
            var cLen = c.length
            
            for(var j=start; j < cLen; j++){
                if(c[j] != null && !/^\s*[xX]\s*$/g.test(c[j])){
                    throw(`Célula inválida na linha ${start+i} e coluna ${i} da tabela! Apenas deve conter x ou X (selecionado) ou nada (não selecionado).`)
                }
            }
        }
    }

    return true
}

function onlyCodigos(codigos, start){
    var len = codigos.length

    for(var i = 0; i < len; i++){
        if(!/^\s*\d+(\.\d+){0,3}\s*$/g.test(codigos[i])){
            throw(`Código inválido na linha ${start+i} da tabela! O código para ser válido deve ser, por exemplo, no seguinte formato: 100 ou 150.01 ou 200.20.002 ou 400.20.100.01`)
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

                if(row[1] == 'Código'){
                    var codigos = worksheet.getColumn(1).values
                    codigos.splice(0,j+1)

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

function parseHeaders(worksheet, rowHeaderN, columns, entidades){
    var headers = worksheet.getRow(rowHeaderN).values
    var typeOrg = null

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
        }
    }

    if(typeOrg == "TS Organizacional"){
        var ent = {
            donos: 0,
            participantes: 0
        }

        for(var i = 0; i < columns.length && typeOrg != null; i++){
            //garante que não há colunas de entidades
            if(!columns[i].entidade){
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
            if(columns[i].entidade){
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

function constructObj(worksheet, codigos, start, c, obj){
    var column = worksheet.getColumn(c.value).values
    var count = 0

    for(var i = start + 1; i < worksheet.rowCount; i++){
        if(/^\s*[xX]\s*$/g.test(column[i])){
            obj.push(codigos[i].replace(/\s*|\r|\n/g,""))
            count++
        }
    }

    return count
}

SelTabs.criarPedidoDoCSV = async function (workbook, email) {
    var aux = findSheet(workbook)
    var sheetN = aux[0]
    var rowHeaderN = aux[1]
    var founded = aux[2]

    if(founded){
        var worksheet = workbook.getWorksheet(sheetN)
        var columns = [] 
        var entidades = []

        var typeOrg = parseHeaders(worksheet, rowHeaderN, columns, entidades)

        if(typeOrg != null){
            var obj
            var stats

            if(typeOrg == "TS Organizacional"){
                obj = {
                    donos: [],
                    participantes: []
                }

                stats = {
                    processos: 0,
                    donos: 0,
                    participantes: 0
                }
            }else{
                obj = {}
                stats = {}
                
                entidades.forEach(e => {
                    obj[e] = {
                        donos: [],
                        participantes: []
                    }

                    stats[e] = {
                        processos: 0,
                        donos: 0,
                        participantes: 0
                    }
                })
            }

            var codigos = worksheet.getColumn(1).values

            if(typeOrg == "TS Organizacional"){
                columns.forEach(c => {
                    stats[c.type + "s"] = constructObj(worksheet, codigos, rowHeaderN, c, obj[c.type + "s"])
                })

                var uniqList = Array.from(new Set(obj.donos.concat(obj.participantes)))
                stats.processos = uniqList.length
            }else{
                columns.forEach(c => {
                    stats[c.entidade][c.type + "s"] = constructObj(worksheet, codigos, rowHeaderN, c, obj[c.entidade][c.type + "s"])
                })

                for(var k in obj){
                    var uniqList = Array.from(new Set(obj[k].donos.concat(obj[k].participantes)))
                    stats[k].processos = uniqList.length
                }
            }

            var pedido = {
                tipoPedido: "Criação",
                tipoObjeto: typeOrg,
                novoObjeto: obj,
                user: {email: email}
            }
            
            try{
                var pedido = await Pedidos.criar(pedido)
                return {codigo: pedido.codigo, stats: stats}
            }catch(e){
                throw(e)
            }
        }else{
            throw("Não contém informação suficiente ou contém colunas a mais. Não é possível distinguir se é TS Organizacional ou TS Pluriorganizacional. " + requisitosFicheiro)
        }
    }else{
        throw("Não foi encontrada informação por forma a criar a tabela de seleção. " + requisitosFicheiro)
    }
}
