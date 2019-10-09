var Call = require('./../../models/call');
var Calls = module.exports

Calls.getRoute = function(req){
    return req.originalUrl.replace(/\?.*$/,"")
}

Calls.newCall = async function(route, method, id, type, httpStatus){
    var call = await Call.findOne({route: route, method: method})

    if(call){
        var len = call.accesses.length
        var index = -1

        for(var i=0; i < len && index == -1; i++){
            if(call.accesses[i].id == id && call.accesses[i].type == type){
                index = i
            }
        }

        if(index != -1){
            var len2 = call.accesses[index].accesses.length
            var index2 = -1

            for(var j=0; j < len2 && index2 == -1; j++){
                if(call.accesses[index].accesses[j]._id == httpStatus){
                    index2 = j
                }
            }

            if(index2 != -1){
                call.accesses[index].accesses[index2].nCalls++
                call.accesses[index].accesses[index2].lastAccess = Date.now()

                return call.save()
            }else{
                call.accesses[index].accesses.push({
                    _id: httpStatus,
                    nCalls: 1,
                    lastAccess: Date.now()
                })

                return call.save()
            }   
        }else{
            call.accesses.push({
                id: id,
                type: type,
                accesses: [{
                    _id: httpStatus,
                    nCalls: 1,
                    lastAccess: Date.now()
                }]
            })

            return call.save()
        }   
    }else{
        return Call.create({
            route: route,
            method: method,
            accesses: [{
                id: id,
                type: type,
                accesses: [{
                    _id: httpStatus,
                    nCalls: 1,
                    lastAccess: Date.now()
                }]
            }]
        })
    }
}

Calls.getCall = function(route, method){
    return Call.findOne({route: route, method: method})
}

Calls.getUserCalls = function(id, type){
    return Call.find({accesses: {$elemMatch: {id: id, type: type}}})
}
