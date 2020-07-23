const Notifier = require('./Notifier');
const User = require('../models/user');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/m51-clav', {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => console.log('Mongo Ready: ' + mongoose.connection.readyState))
        .catch((erro) => console.log('Mongo: erro da conexão ' + erro));

async function main(){
    var users = await User.find()
    users.forEach(user => {
        Notifier.bind(user.email, user.entidade)
        console.log(`${user.name} Binded to: ${user.email} && ${user.entidade} `)
    })
    mongoose.connection.close()
}

main();

setTimeout(function() {process.exit()},60000)