/**
 * Normaliza e simplifica os resultados de uma query SPARQL.
 * 
 * @example
 * response = {  
 *   head: { vars: ["sigla", "designacao", "estado", "internacional"] },
 *   results: {
 *     bindings: [{  
 *       estado:{ type: "literal", value:"Ativa" },
 *       sigla: { type:"literal", value:"AR" },
 *       designacao: { type:"literal", value:"Assembeia da República" },
 *       internacional: { type:"literal", value:"Não" }
 *     }]
 *   }
 * }
 * 
 * // O resultado da normalização da resposta acima será:
 * [{ estado: "Ativa", sigla: "PGR", designacao:"Assembleia da República", internacional:"Não" }]
 * 
 * @param response objeto de resposta da query SPARQL
 * @return objeto normalizado e simplificado
 */
exports.normalize = function(response) {
    return response.results.bindings.map(obj =>
        Object.entries(obj)
            .reduce((new_obj, [k,v]) => (new_obj[k] = v.value, new_obj),
                    new Object()));
};

/**
 * Normaliza e simplifica os resultados de uma query SPARQL mantendo a ordem das variáveis da query SPARQL.
 * 
 * @example
 * response = {  
 *   head: { vars: ["sigla", "designacao", "estado", "internacional"] },
 *   results: {
 *     bindings: [{  
 *       estado:{ type: "literal", value:"Ativa" },
 *       sigla: { type:"literal", value:"AR" },
 *       designacao: { type:"literal", value:"Assembeia da República" },
 *       internacional: { type:"literal", value:"Não" }
 *     }]
 *   }
 * }
 * 
 * // O resultado da normalização da resposta acima será:
 * [{ sigla: "PGR", designacao:"Assembleia da República", estado: "Ativa", internacional:"Não" }]
 * 
 * @param response objeto de resposta da query SPARQL
 * @return objeto normalizado e simplificado (ordenado)
 */
exports.normalizeOrdered = function(response) {
    var out = []
    
    response.results.bindings.forEach(e => {
        var outE = {}
        response.head.vars.forEach( v => {
            if(e[v])
                outE[v] = e[v].value
        })
        out.push(outE)
    })

    return out
};

/**
 * Efetua uma projeção sobre uma lista de objetos.
 * 
 * @example
 * objs = [
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: "leg_1" },
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: "leg_2" },
 *  { sigla: "CEE", designacao: "Comunidade Económica Europeia", legislacao: "leg_1" },
 *  { sigla: "DGAV", designacao: "Direção Geral de Alimentação e Veterinária" } 
 * ];
 * projection(objs, ["sigla", "designacao"], ["legislacao"]) === [
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: ["leg_1","leg_2"] },
 *  { sigla: "CEE", designacao: "Comunidade Económica Europeia", legislacao: ["leg_1"] },
 *  { sigla :"DGAV", designacao: "Direção Geral de Alimentação e Veterinária", legislacao:[]}
 * ];
 * 
 * @param {[Object]} objs lista de objetos 
 * @param {[string]} fields lista de campos sobre os quais se fará a projeção
 * @param {[string]} group lista de campos a agrupar
 * @return lista de objetos com os campos selecionados da projeção
 */
exports.projection = function(objs, fields, group) {
    let result = new Map();
    for (obj of objs) {
        const proj = JSON.stringify(fields.reduce((new_obj, col) => Object.defineProperty(new_obj, col, {
            value: obj[col],
            enumerable: !0
        }), new Object()));
        let g = {};
        if (result.has(proj)) {
            g = Object.entries(result.get(proj)).reduce((new_obj, [k, v]) => Object.defineProperty(new_obj, k, {
                value: (v.push(obj[k]), v),
                enumerable: !0
            }), new Object())
        } else {
            g = group.reduce((new_obj, k) => Object.defineProperty(new_obj, k, {
                value: obj[k] ? [obj[k]] : [],
                enumerable: !0
            }), new Object())
        }
        result.set(proj, g)
    }
    return Array.from(result.entries()).map(([x, y]) => Object.assign(JSON.parse(x), y))
}
