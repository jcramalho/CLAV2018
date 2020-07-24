const Notifier = require('./Notifier');
const User = require('../models/user');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/m51-clav', {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => console.log('Mongo Ready: ' + mongoose.connection.readyState))
        .catch((erro) => console.log('Mongo: erro da conexão ' + erro));

async function RabbitMQ(){
    var users = await User.find()
    users.forEach(user => {
        console.log(`${user.name} Binded to: ${user.email} && ${user.entidade} `)
        Notifier.bind(user.email, user.entidade)
    })
}

RabbitMQ();

setTimeout(() => {
    mongoose.connection.close()
    process.exit()
}, 60000)
