/**
 * Carrega a árvore de classes em estruturas de suporte 
 *   - vai permitir acelerar as querys e todas as operações de consulta
 */
var Classes = require('./api/classes.js')
var NotasAp = require('./api/notasAp.js')
var ExemplosNotasAp = require('./api/exemplosNotasAp.js')
var TermosIndice = require('./api/termosIndice.js')

var classTree = []
var classList = []
var level1Classes = []
var level2Classes = []
var level3Classes = []
var level4Classes = []

var classTreeInfo = []
var classListInfo = []
var classListSimpleInfo = []
var level1ClassesInfo = []
var level2ClassesInfo = []
var level3ClassesInfo = []
var level4ClassesInfo = []

var notasAplicacao = []
var exemplosNotasAplicacao = []
var termosInd = []

// Índice invertido de suporte ao motor de busca: 
//  [ {chave: "texto duma nota, exemplo ou ti", processo:{codigo:"cxxx", titulo:"..."}}, ...]
var indiceInvertido = []

exports.reset = async () => { 
    try {
        console.debug("A carregar as classes da BD para a cache...")
        classTree = await loadClasses();
        classList = level1Classes.concat(level2Classes, level3Classes, level4Classes)
        console.debug("Terminei de carregar as classes.")
        console.debug("A criar o índice invertido...")
        indiceInvertido = await criaIndice()
        console.debug("Índice criado com " + indiceInvertido.length + " entradas.")
    } catch(err) {
        throw err
    }
}

exports.reload = async () => { 
    try {
        console.debug("A carregar as classes da BD para a cache...")
        level1Classes = []
        level2Classes = []
        level3Classes = []
        level4Classes = []

        level1ClassesInfo = []
        level2ClassesInfo = []
        level3ClassesInfo = []
        level4ClassesInfo = []

        notasAplicacao = []
        exemplosNotasAplicacao = []
        termosInd = []

        classTree = await loadClasses();
        classList = level1Classes.concat(level2Classes, level3Classes, level4Classes)
        classTreeInfo = await loadClassesInfo();
        classListInfo = level1ClassesInfo.concat(level2ClassesInfo, level3ClassesInfo, level4ClassesInfo)
        classListSimpleInfo = classesIndicePesquisa(classListInfo)
        console.debug("Terminei de carregar as classes.")
        console.debug("A criar o índice invertido...")
        indiceInvertido = await criaIndice()
        console.debug("Índice criado com " + indiceInvertido.length + " entradas.")
    } catch(err) {
        throw err
    }
}

exports.getAllClasses = async () => { return classTree }
exports.getClassesFlatList = async () => { return classList }
exports.getLevel1Classes = async () => { return level1Classes }
exports.getLevel2Classes = async () => { return level2Classes }
exports.getLevel3Classes = async () => { return level3Classes }
exports.getLevel4Classes = async () => { return level4Classes }

exports.getAllClassesInfo = async () => { return classTreeInfo }
exports.getClassesInfoFlatList = async () => { return classListInfo }
exports.getLevel1ClassesInfo = async () => { return level1ClassesInfo }
exports.getLevel2ClassesInfo = async () => { return level2ClassesInfo }
exports.getLevel3ClassesInfo = async () => { return level3ClassesInfo }
exports.getLevel4ClassesInfo = async () => { return level4ClassesInfo }

exports.getIndiceInvertido = async () => { return indiceInvertido }
exports.pesquisaClassesIndice = async () => { return classListSimpleInfo }

// Verifica a existência do código de uma classe: true == existe, false == não existe
exports.verificaCodigo = async (cod) => {
    var nivel = cod.split('.').length
    var r = false
    switch(nivel){
        case 1: r = await level1Classes.filter(c => c.codigo == cod).length != 0
                break
        case 2: r = await level2Classes.filter(c => c.codigo == cod).length != 0
                break
        case 3: r = await level3Classes.filter(c => c.codigo == cod).length != 0
                break
        case 4: r = await level4Classes.filter(c => c.codigo == cod).length != 0
                break
        default: console.log('Classe de nível inexistente: ' + cod)
    }
    return r
}

// Verifica a existência do título de uma classe: true == existe, false == não existe
exports.verificaTitulo = async (titulo) => {
    var r = false
    r = await classList.filter(c => c.titulo == titulo).length != 0
    return r
}

// Verifica a existência duma nota de aplicação: true == existe, false == não existe
exports.verificaNA = async (na) => {
    var r = false
    r = await notasAplicacao.filter(n => n == na).length != 0
    return r
}

// Verifica a existência dum exemplo de nota de aplicação: true == existe, false == não existe
exports.verificaExemploNA = async (exemplo) => {
    var r = false
    r = await exemplosNotasAplicacao.filter(e => e == exemplo).length != 0
    return r
}

// Verifica a existência dum termo de índice: true == existe, false == não existe
exports.verificaTI = async (ti) => {
    var r = false
    r = await termosInd.filter(t => t == ti).length != 0
    return r
}

//Devolve a lista dos processos de negócio comuns, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
exports.getProcessosComuns = async () => {
    let PC = await Classes.listarPNsComuns();
    return PC;
}

//Devolve a lista dos processos de negócio comuns, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
exports.getProcessosComunsInfo = async () => {
    let PC = classListInfo.filter(c => c.tipoProc == "Processo Comum")
    return PC;
}

//Devolve a lista dos processos de negócio especificos, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
// especificos da entidade em causa e das tipologias a que este pertence
exports.getProcessosEspecificos = async (entidades, tipologias) => {
    let PE = await Classes.listarPNsEspecificos(entidades, tipologias);
    return PE;
}

function filterEntsTips(classe, ent_tip){
    var ret = classe.tipoProc == "Processo Específico"

    if(ret && ent_tip.length > 0){
        var donos = classe.donos.filter(d => ent_tip.includes(d.idDono))
        var parts = classe.participantes.filter(p => ent_tip.includes(p.idParticipante)) 
        ret = donos.length > 0 || parts.length > 0
    }

    return ret
}

//Devolve a lista dos processos de negócio especificos, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
// especificos da entidade em causa e das tipologias a que este pertence
exports.getProcessosEspecificosInfo = async (entidades, tipologias) => {
    entidades = entidades || []
    tipologias = tipologias || []

    let ent_tip = entidades.concat(tipologias)
    let PE = classListInfo.filter(c => filterEntsTips(c, ent_tip))

    return PE;
}

async function criaIndice(){
    let notas = await NotasAp.todasNotasAp()
    let exemplos = await ExemplosNotasAp.todosExemplosNotasAp()
    let tis = await TermosIndice.listar()
    let indice = []
    
    //  [ {chave: "texto duma nota, exemplo ou ti", processo:{codigo:"cxxx", titulo:"..."}}, ...]
    indice = indice.concat(classList.map(c => ({chave: c.codigo, processo: {codigo: c.codigo, titulo: c.titulo}})))
    indice = indice.concat(classList.map(c => ({chave: c.titulo, processo: {codigo: c.codigo, titulo: c.titulo}})))
    indice = indice.concat(notas.map(n => ({chave: n.nota, processo: {codigo: n.cProc, titulo: n.tituloProc}})))
    indice = indice.concat(exemplos.map(e => ({chave: e.exemplo, processo: {codigo: e.cProc, titulo: e.tituloProc}})))
    indice = indice.concat(tis.map(t => ({chave: t.termo, processo: {codigo: t.codigoClasse, titulo: t.tituloClasse}})))

    return indice
}

async function loadClasses() {
        try {
            let classes = await Classes.listar(null);
            level1Classes = JSON.parse(JSON.stringify(classes))
            // Carregamento da informação das classes de nível 1
            for(var i = 0; i < classes.length; i++){
                classes[i].drop = false
                let cid = classes[i].id.split('#')[1]
                let desc = await Classes.descendencia(cid)
                level2Classes = level2Classes.concat(JSON.parse(JSON.stringify(desc)))

                let na = await Classes.notasAp(cid)
                notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                let ex = await Classes.exemplosNotasAp(cid)
                exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                // Carregamento da informação das classes de nível 2
                for(var j=0; j < desc.length; j++){
                    let cid2 = desc[j].id.split('#')[1]
                    desc[j].drop = false
                    let desc2 = await Classes.descendencia(cid2)
                    level3Classes = level3Classes.concat(JSON.parse(JSON.stringify(desc2)))

                    let na = await Classes.notasAp(cid2)
                    notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                    let ex = await Classes.exemplosNotasAp(cid2)
                    exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                    // Carregamento da informação das classes de nível 3
                    for(var k=0; k < desc2.length; k++){
                        desc2[k].drop = false
                        let cid3 = desc2[k].id.split('#')[1]
                        let desc3 = await Classes.descendencia(cid3)
                        level4Classes = level4Classes.concat(JSON.parse(JSON.stringify(desc3)))

                        let na = await Classes.notasAp(cid3)
                        notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                        let ex = await Classes.exemplosNotasAp(cid3)
                        exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))
                        let ti3 = await Classes.ti(cid3)
                        termosInd = termosInd.concat(JSON.parse(JSON.stringify(ti3.map(t => t.termo))))

                        // Carregamento dos TI das classes de nível 4
                        for(var l=0; l < desc3.length; l++){
                            let cid4 = desc3[l].id.split('#')[1]
                            let ti4 = await Classes.ti(cid4)
                            termosInd = termosInd.concat(JSON.parse(JSON.stringify(ti4.map(t => t.termo))))
                        }

                        desc2[k].filhos = desc3
                    }
                    desc[j].filhos = desc2
                }
                classes[i].filhos = desc
            }
            return classes;
        } catch(err) {
            throw err;
        }
}

async function getAllClassesInfo(list) {
    var ret = []

    for(var i=0; i < list.length; i++){
        var classe = await Classes.retrieve('c' + list[i].codigo)
        var copy = JSON.parse(JSON.stringify(classe))
        delete copy.filhos
        switch(copy.nivel){
            case 1:
                level1ClassesInfo.push(copy)
                break
            case 2:
                level2ClassesInfo.push(copy)
                break
            case 3:
                level3ClassesInfo.push(copy)
                break
            case 4:
                level4ClassesInfo.push(copy)
                break
        }
        classe.filhos = await getAllClassesInfo(classe.filhos)
        ret.push(classe)
    }

    return ret
}

async function loadClassesInfo() {
    try{
        return await getAllClassesInfo(classTree)
    } catch(err) {
        throw err;
    }
}

function classesIndicePesquisa(list){
    var classes = []

    list.forEach(c => {
        var classe = {}

        classe.idClasse = c.codigo
        classe.titulo = c.titulo
        classe.descricao = c.descricao
        classe.notasAp = []
        c.notasAp.forEach(n => classe.notasAp.push(n.nota))
        classe.exemplosNotasAp = []
        c.exemplosNotasAp.forEach(e => classe.exemplosNotasAp.push(e.exemplo))
        classe.termosIndice = []
        c.termosInd.forEach(t => classe.termosIndice.push(t.termo))

        classes.push(classe)
    })

    return classes
}
