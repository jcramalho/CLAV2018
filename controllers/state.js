var fs = require('fs')

/**
 * Carrega a árvore de classes em estruturas de suporte 
 *   - vai permitir acelerar as querys e todas as operações de consulta
 */
var Classes = require('./api/classes.js')
var Legs = require('./api/leg.js')
var NotasAp = require('./api/notasAp.js')
var ExemplosNotasAp = require('./api/exemplosNotasAp.js')
var TermosIndice = require('./api/termosIndice.js')

var classTree = []
var classList = []
//level 1, 2, 3, 4
var levelClasses = [[],[],[],[]]
var classTreeInfo = []

var notasAplicacao = []
var exemplosNotasAplicacao = []
var termosInd = []

var legislacao = []

// Índice de pesquisa para v-trees: 
var indicePesquisa = []

exports.reset = async () => { 
    try {
        console.debug("A carregar as classes da BD para a cache...")
        classTree = await loadClasses();
        classList = [].concat.apply([], levelClasses)
        console.debug("Terminei de carregar as classes.")

        console.debug("A carregar a informação completa das classes para a cache a partir do ficheiro...")
        classTreeInfo = JSON.parse(fs.readFileSync('./public/classes/classesInfo.json'))
        console.debug("Terminei de carregar a informação completa das classes.")

        console.debug("A carregar a legislação da BD para a cache...")
        legislacao = await loadLegs();
        console.debug("Terminei de carregar a legislação.")

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
        levelClasses = [[],[],[],[]]

        notasAplicacao = []
        exemplosNotasAplicacao = []
        termosInd = []

        legislacao = []

        classTree = await loadClasses();
        classList = [].concat.apply([], levelClasses)
        console.debug("Informação base das classes carregada...")



        console.debug("A carregar a legislação da BD para a cache...")
        legislacao = await loadLegs();
        console.debug("Terminei de carregar a legislação.")

        console.debug("A criar o índice de pesquisa...")
        indicePesquisa = await criaIndicePesquisa()
        console.debug("Índice de pesquisa criado com " + indicePesquisa.length + " entradas.")

        //Carrega a info completa de todas as classes de forma assincrona
        console.debug("A obter a informação completa das classes...")
        classTreeInfo = await loadClassesInfo()
        console.debug("a guardar a informação num ficheiro...")
        fs.writeFileSync('./public/classes/classesInfo.json', JSON.stringify(classTreeInfo, null, 4))
        console.debug("Terminei de carregar a informação completa das classes.")
    } catch(err) {
        throw err
    }
}

exports.getAllClasses = async () => { return classTree }
exports.getClassesFlatList = async () => { return classList }
exports.getLevelClasses = async (nivel) => {
    var ret = []

    if(nivel >= 1 && nivel <= 4){
        ret = levelClasses[nivel-1] 
    }

    return ret
}

exports.getAllClassesInfo = async () => {
    return classTreeInfo
}

exports.getClassesInfoFlatList = async () => { 
    var ret = JSON.parse(JSON.stringify(classTreeInfo))
    
    var len = ret.length
    for(var i = 0; i < len; i++){
        ret[i].filhos.forEach(c => {
            ret.push(c)
            len++
        })

        delete ret[i].filhos
    }

    return ret
}

exports.getLevelClassesInfo = (nivel) => {
    var ret = []

    if(nivel >= 1 && nivel <= 4){
        ret = getLevelClassesInfoRec(nivel-1, classTreeInfo)
    }

    return ret
}

function getLevelClassesInfoRec(nivel, classes) {
    var ret = []

    if(nivel == 0){
        for(var i = 0; i < classes.length; i++){
            var classe = JSON.parse(JSON.stringify(classes[i]))
            delete classe.filhos
            ret.push(classe)
        }
    }else{
        for(var i = 0; i < classes.length; i++){
            ret = ret.concat(getLevelClassesInfoRec(nivel-1, classes[i].filhos))
        }
    }

    return ret
}

//Devolve a informação das classes da subárvore com raiz na classe com o id 'id'
exports.subarvore = async id => {
    var ret = JSON.parse(JSON.stringify(classTreeInfo))
    var finded = null;

    var codigo = id.split('c')[1]
    codigos = codigo.split('.')
    var nivel = codigos.length
    var found

    for(var i = 0; i < nivel; i++){
        found = false
        testCodigo = codigos.slice(0, i + 1).join('.') 

        for(var j = 0; j < ret.length && !found; j++){
            if(ret[j].codigo == testCodigo){
                if(nivel == i + 1){
                    ret = ret[j]
                }else{
                    ret = ret[j].filhos
                }
                found = true
            }
        }

        if(!found){
            ret = []
        }
    }

    return ret
}

//Devolve o esqueleto que serve de formulário para a criação de uma TS
exports.getEsqueleto = () => {
    var ret = []

    classTreeInfo.forEach(c1 => {
        c1.filhos.forEach(c2 => {
            c2.filhos.forEach(c3 => {
                ret.push({
                    codigo: c3.codigo,
                    titulo: c3.titulo,
                    descricao: c3.descricao,
                    status: c3.status,
                    dono: "",
                    participante: "",
                    pca: c3.pca.valores,
                    df: c3.df.valor
                })
                c3.filhos.forEach(c4 => {
                    ret.push({
                        codigo: c4.codigo,
                        titulo: c4.titulo,
                        descricao: c4.descricao,
                        status: c4.status,
                        dono: "",
                        participante: "",
                        pca: c4.pca.valores,
                        df: c4.df.valor
                    })
                })
            })
        })
    })

    return ret
}

exports.getIndicePesquisa = async () => { return indicePesquisa }

exports.getLegislacao = (id) => {
    let res = legislacao.filter(l => l.id == id)
    if (res.length > 0) {
        return res[0]
    }
    else
        return null
}

// Verifica a existência do código de uma classe: true == existe, false == não existe
exports.verificaCodigo = async (cod) => {
    var nivel = cod.split('.').length
    var r = false

    if(nivel >= 1 && nivel <= 4){
        r = await levelClasses[nivel-1].filter(c => c.codigo == cod).length != 0
    }else{
        console.log('Classe de nível inexistente: ' + cod)
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

//devolve se uma classe é um processo especifico e se tem como dona ou participante uma das entidades/tipologias selecionadas
function filterEspEntsTips(classe, ent_tip){
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
    let PE = classListInfo.filter(c => filterEspEntsTips(c, ent_tip))

    return PE;
}

//devolve se uma classe tem como dona ou participante uma das entidades/tipologias selecionadas
function filterEntsTips(classe, ent_tip){
    var donos = classe.donos.filter(d => ent_tip.includes(d.idDono))
    var parts = classe.participantes.filter(p => ent_tip.includes(p.idParticipante)) 
    return donos.length > 0 || parts.length > 0
}

//Função auxiliar recursiva para getProcEntsTips
function getProcEntsTipsRec(classes, ent_tip, allInfo){
    var ret = []

    for(var i = 0; i < classes.length; i++){
        var filhos = getProcEntsTipsRec(classes[i].filhos, ent_tip, allInfo)
        
        if(filterEntsTips(classes[i], ent_tip) || (filhos && filhos.length > 0)){
            var classe
            if(allInfo){
                classe = JSON.parse(JSON.stringify(classes[i]))
                classe.filhos = filhos
            }else{
                classe = {
                    id: classes[i].id,
                    codigo: classes[i].codigo,
                    titulo: classes[i].titulo,
                    status: classes[i].status,
                    filhos: filhos
                }
            }
            ret.push(classe)
        }
    }

    return ret
}

//Devolve a lista dos processos das entidades (mantendo os niveis a qual pertence) em causa e das tipologias a que este pertence
exports.getProcEntsTips = (entidades, tipologias, allInfo) => {
    entidades = entidades || []
    tipologias = tipologias || []
    let ent_tip = entidades.concat(tipologias)
    var ret = []

    if(ent_tip.length > 0){
        ret = getProcEntsTipsRec(classTreeInfo, ent_tip, allInfo)
    }

    return ret;
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

// Carrega o catálogo legislativo na cache

async function loadLegs() {
    try{
        let legs = await Legs.listar()
        return legs
    }
    catch(err) {
        throw err;
    }
}

async function loadClasses() {
        try {
            let classes = await Classes.listar(null);
            levelClasses[0] = JSON.parse(JSON.stringify(classes))
            // Carregamento da informação das classes de nível 1
            for(var i = 0; i < classes.length; i++){
                classes[i].drop = false
                let cid = classes[i].id.split('#')[1]
                let desc = await Classes.descendencia(cid)
                levelClasses[1] = levelClasses[1].concat(JSON.parse(JSON.stringify(desc)))

                let na = await Classes.notasAp(cid)
                notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                let ex = await Classes.exemplosNotasAp(cid)
                exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                // Carregamento da informação das classes de nível 2
                for(var j=0; j < desc.length; j++){
                    let cid2 = desc[j].id.split('#')[1]
                    desc[j].drop = false
                    let desc2 = await Classes.descendencia(cid2)
                    levelClasses[2] = levelClasses[2].concat(JSON.parse(JSON.stringify(desc2)))

                    let na = await Classes.notasAp(cid2)
                    notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                    let ex = await Classes.exemplosNotasAp(cid2)
                    exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                    // Carregamento da informação das classes de nível 3
                    for(var k=0; k < desc2.length; k++){
                        desc2[k].drop = false
                        let cid3 = desc2[k].id.split('#')[1]
                        let desc3 = await Classes.descendencia(cid3)
                        levelClasses[3] = levelClasses[3].concat(JSON.parse(JSON.stringify(desc3)))

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
