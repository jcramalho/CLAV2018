var Auth = module.exports;
var axios = require('axios')
var Parametros = require('./api/parametros')
var servAuthHost = require('../config/database').serverAuthHost

Auth.generateTokenUserRecuperar = async function (user) {
    var response = await axios.post(servAuthHost + "/user/sign", {
        user: {
            id: user._id,
            name: user.name,
            level: 0,
            entidade: user.entidade,
            email: user.email
        },
        expiresIn: '30m'
    })

    return response.data.token
}

Auth.generateTokenUser = async function (user) {
    var response = await axios.post(servAuthHost + "/user/sign", {
        user: {
            id: user._id,
            name: user.name,
            level: user.level,
            entidade: user.entidade,
            email: user.email
        },
        expiresIn: userExpires
    })

    return response.data.token
}

Auth.verifyTokenUser = async function (key) {
    var response = await axios.post(servAuthHost + "/user/verify", { key: key })
    return response.data
}

Auth.generateTokenKey = async function (chaveId) {
    var response = await axios.post(servAuthHost + "/apikey/sign", {
        apikey: {
            id: chaveId
        },
        expiresIn: keyExpires
    })

    return response.data.token
}

Auth.verifyTokenKey = async function (key) {
    var response = await axios.post(servAuthHost + "/apikey/verify", { key: key })
    return response.data
}
