var fs = require('fs')

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

var notasAplicacao = []
var exemplosNotasAplicacao = []
var termosInd = []

// Índice de pesquisa para v-trees: 
var indicePesquisa = []

exports.reset = async () => { 
    try {
        console.debug("A carregar as classes da BD para a cache...")
        classTree = await loadClasses();
        classList = level1Classes.concat(level2Classes, level3Classes, level4Classes)
        console.debug("Terminei de carregar as classes.")
        console.debug("A criar o índice de pesquisa...")
        indicePesquisa = await criaIndicePesquisa()
        console.debug("Índice de pesquisa criado com " + indicePesquisa.length + " entradas.")
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

        notasAplicacao = []
        exemplosNotasAplicacao = []
        termosInd = []

        classTree = await loadClasses();
        classList = level1Classes.concat(level2Classes, level3Classes, level4Classes)
        console.debug("Informação base das classes carregada...")

        console.debug("A criar o índice de pesquisa...")
        indicePesquisa = await criaIndicePesquisa()
        console.debug("Índice de pesquisa criado com " + indicePesquisa.length + " entradas.")

        //Carrega a info completa de todas as classes de forma assincrona
        console.debug("A obter a informação completa das classes e a guardar a mesma num ficheiro...")
        var data = await loadClassesInfo()
        fs.writeFileSync('./public/classes/classesInfo.json', JSON.stringify(data, null, 4))
        console.debug("Terminei de carregar as classes.")
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

exports.getAllClassesInfo = async () => {
    return JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
}

exports.getClassesInfoFlatList = async () => { 
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
    
    var len = classTreeInfo.length
    for(var i = 0; i < len; i++){
        classTreeInfo[i].filhos.forEach(c => {
            classTreeInfo.push(c)
            len++
        })

        delete classTreeInfo[i].filhos
    }

    return classTreeInfo
}

exports.getLevel1ClassesInfo = async () => {
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))

    for(var i = 0; i < classTreeInfo.length; i++){
        delete classTreeInfo[i].filhos
    }

    return classTreeInfo
}

exports.getLevel2ClassesInfo = async () => {
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
    var ret = []

    for(var i = 0; i < classTreeInfo.length; i++){
        for(var j = 0; j < classTreeInfo[i].filhos.length; j++){
            delete classTreeInfo[i].filhos[j].filhos
            ret.push(classTreeInfo[i].filhos[j])
        }
    }

    return ret
}

exports.getLevel3ClassesInfo = async () => {
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
    var ret = []

    for(var i = 0; i < classTreeInfo.length; i++){
        for(var j = 0; j < classTreeInfo[i].filhos.length; j++){
            for(var k = 0; k < classTreeInfo[i].filhos[j].filhos.length; k++){
                delete classTreeInfo[i].filhos[j].filhos[k].filhos
                ret.push(classTreeInfo[i].filhos[j].filhos[k])
            }
        }
    }

    return ret
}

exports.getLevel4ClassesInfo = async () => {
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
    var ret = []

    for(var i = 0; i < classTreeInfo.length; i++){
        for(var j = 0; j < classTreeInfo[i].filhos.length; j++){
            for(var k = 0; k < classTreeInfo[i].filhos[j].filhos.length; k++){
                for(var l = 0; l < classTreeInfo[i].filhos[j].filhos[k].filhos.length; l++){
                    delete classTreeInfo[i].filhos[j].filhos[k].filhos[l].filhos
                    ret.push(classTreeInfo[i].filhos[j].filhos[k].filhos[l])
                }
            }
        }
    }

    return ret
}

//Devolve a informação das classes da subárvore com raiz na classe com o id 'id'
exports.subarvore = async id => {
    var classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
    var finded = null;

    var codigo = id.split('c')[1]
    codigos = codigo.split('.')
    var nivel = codigos.length
    var len
    var found

    for(var i = 0; i < nivel; i++){
        len = classTreeInfo.length
        found = false
        testCodigo = codigos.slice(0, i + 1).join('.') 

        for(var j = 0; j < len && !found; j++){
            if(classTreeInfo[j].codigo == testCodigo){
                if(nivel == i + 1){
                    classTreeInfo = classTreeInfo[j]
                }else{
                    classTreeInfo = classTreeInfo[j].filhos
                }
                found = true
            }
        }

        if(!found){
            classTreeInfo = []
        }
    }

    return classTreeInfo
}

exports.getIndicePesquisa = async () => { return indicePesquisa }

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
    var classListInfo = await this.getClassesInfoFlatList()
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
    var classListInfo = await this.getClassesInfoFlatList()

    let ent_tip = entidades.concat(tipologias)
    let PE = classListInfo.filter(c => filterEntsTips(c, ent_tip))

    return PE;
}

async function criaIndicePesquisa(){
    let notas = await NotasAp.todasNotasAp()
    let exemplos = await ExemplosNotasAp.todosExemplosNotasAp()
    let tis = await TermosIndice.listar()
    let indice = []
    
    //  [ {codigo:"cxxx", titulo:"...", notas: [], exemplos:[], tis:[]}, ...]
    indice = indice.concat(classList.map(c => ({codigo: c.codigo, titulo: c.titulo, notas:[], exemplos:[], tis:[]})))
    // Vamos colocar as notas no processo certo
    notas.forEach(n => {
        var index = indice.findIndex(c => {
            return ('c'+c.codigo) == n.cProc
        })
        if(index != -1){
            indice[index].notas.push(n.nota)
        }
        else{
            console.log('Cálculo do índice::Notas:: não encontrei a classe com código: ' + n.cProc)
        }
    })
    
    // Vamos fazer o mesmo para os exemplos
    exemplos.forEach(e => {
        var index = indice.findIndex(c => {
            return ('c'+c.codigo) == e.cProc
        })
        if(index != -1){
            indice[index].exemplos.push(e.exemplo)
        }
        else{
            console.log('Cálculo do índice::Exemplos:: não encontrei a classe com código: ' + e.cProc)
        }
    })
    // Vamos fazer o mesmo para os tis
    tis.forEach(t => {
        var index = indice.findIndex(c => {
            return ('c'+c.codigo) == t.codigoClasse
        })
        if(index != -1){
            indice[index].tis.push(t.termo)
        }
        else{
            console.log('Cálculo do índice::Termos:: não encontrei a classe com código: ' + t.codigoClasse)
        }
    }) 
    
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
        classe.filhos = await getAllClassesInfo(classe.filhos)
        ret.push(classe)
    }

    return ret
}

async function loadClassesInfo() {
    try{
        return await getAllClassesInfo(classTree)
    }catch(err){
        throw err
    }   
}
