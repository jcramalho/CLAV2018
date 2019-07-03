/**
 * Carrega a árvore de classes em estruturas de suporte 
 *   - vai permitir acelerar as querys e todas as operações de consulta
 */
var Classes = require('./api/classes.js');

var classTree = []
var classList = []
var level1Classes = []
var level2Classes = []
var level3Classes = []
var level4Classes = []

var notasAplicacao = []
var exemplosNotasAplicacao = []

exports.reset = async () => { 
    try {
        console.debug("Loading classes from DB")
        classTree = await loadClasses();
        classList = level1Classes.concat(level2Classes, level3Classes, level4Classes)
        console.debug("Finished loading...")
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

//Devolve a lista dos processos de negócio comuns, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
exports.getProcessosComuns = async () => {
    console.log("Processos Comuns");
    let PC = await Classes.listarPNsComuns();
    return PC;
}

//Devolve a lista dos processos de negócio especificos, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
// especificos da entidade em causa e das tipologias a que este pertence
exports.getProcessosEspecificos = async (idEntidade, tipologias) => {
    console.log("Processos Especificos");
    let PE = await Classes.listarPNsEspecificos(idEntidade, tipologias);
    return PE;
}

async function loadClasses() {
        try {
            let classes = await Classes.listar(null);
            level1Classes = JSON.parse(JSON.stringify(classes))
            for(var i = 0; i < classes.length; i++){
                classes[i].drop = false
                let cid = classes[i].id.split('#')[1]
                let desc = await Classes.descendencia(cid)
                level2Classes = level2Classes.concat(JSON.parse(JSON.stringify(desc)))

                let na = await Classes.notasAp(cid)
                notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                let ex = await Classes.exemplosNotasAp(cid)
                exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                for(var j=0; j < desc.length; j++){
                    let cid2 = desc[j].id.split('#')[1]
                    desc[j].drop = false
                    let desc2 = await Classes.descendencia(cid2)
                    level3Classes = level3Classes.concat(JSON.parse(JSON.stringify(desc2)))

                    let na = await Classes.notasAp(cid2)
                    notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                    let ex = await Classes.exemplosNotasAp(cid2)
                    exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

                    for(var k=0; k < desc2.length; k++){
                        desc2[k].drop = false
                        let cid3 = desc2[k].id.split('#')[1]
                        let desc3 = await Classes.descendencia(cid3)
                        level4Classes = level4Classes.concat(JSON.parse(JSON.stringify(desc3)))

                        let na = await Classes.notasAp(cid3)
                        notasAplicacao = notasAplicacao.concat(JSON.parse(JSON.stringify(na.map(n => n.nota))))
                        let ex = await Classes.exemplosNotasAp(cid3)
                        exemplosNotasAplicacao = exemplosNotasAplicacao.concat(JSON.parse(JSON.stringify(ex.map(e => e.exemplo))))

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
