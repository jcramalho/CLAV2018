/**
 * Carrega a árvore de classes em estruturas de suporte 
 *   - vai permitir acelerar as querys e todas as operações de consulta
 */
var Classes = require('./api/classes.js');

var classTree = []
var level1Classes = []
var level2Classes = []
var level3Classes = []
var level4Classes = []

exports.reset = async () => { 
    try {
        console.debug("Loading classes from DB")
        classTree = await loadClasses();
        console.debug("Finished loading...")
    } catch(err) {
        throw err
    }
}

exports.getAllClasses = async () => { return classTree }
exports.getLevel1Classes = async () => { return level1Classes }
exports.getLevel2Classes = async () => { return level2Classes }
exports.getLevel3Classes = async () => { return level3Classes }
exports.getLevel4Classes = async () => { return level4Classes }

async function loadClasses() {
        try {
            let classes = await Classes.listar(null);
            level1Classes = JSON.parse(JSON.stringify(classes))
            for(var i = 0; i < classes.length; i++){
                classes[i].drop = false
                let cid = classes[i].id.split('#')[1]
                let desc = await Classes.descendencia(cid)
                level2Classes = level2Classes.concat(JSON.parse(JSON.stringify(desc)))
                for(var j=0; j < desc.length; j++){
                    let cid2 = desc[j].id.split('#')[1]
                    desc[j].drop = false
                    let desc2 = await Classes.descendencia(cid2)
                    level3Classes = level3Classes.concat(JSON.parse(JSON.stringify(desc2)))
                    for(var k=0; k < desc2.length; k++){
                        desc2[k].drop = false
                        let cid3 = desc2[k].id.split('#')[1]
                        let desc3 = await Classes.descendencia(cid3)
                        level4Classes = level4Classes.concat(JSON.parse(JSON.stringify(desc3)))
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
