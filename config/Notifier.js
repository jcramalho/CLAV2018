
var open = require('amqplib').connect('amqp://localhost');

var exchange = 'notificacoes'
var type = 'direct';

var Notifier = module.exports

var connection;

Notifier.bind = function (usr, ent){
    let channel;
    usr = usr.toLowerCase().replace(' ', '_');
    ent = ent.toLowerCase().replace(' ', '_');
    open.then((conn) => {
            connection = conn;
            return conn.createChannel()
        })
        .then((ch) => channel = ch)
        .then(() => channel.assertExchange(exchange, type, {
            durable: true,
            autoDelete: false
        }))
        .then(() => channel.assertQueue(usr,{durable: true}))
        .then(() => channel.bindQueue(usr,exchange, 'usr:' + usr))
        .then(() => channel.bindQueue(usr,exchange, 'ent:' + ent))
        .then(() => channel.close())
        .catch(console.warn)
}
   

Notifier.pubUsr = function (user, msg){
    let channel;
    var usr = user.toLowerCase().replace(' ', '_');
    open.then((conn) => {
            connection = conn;
            return conn.createChannel()
        })
        .then((ch) => {
            channel = ch;
            ch.publish(exchange,'usr:'+usr, Buffer.from(JSON.stringify(msg)),{
                persistent: true
            })
        })
        .then(() => channel.close())
        .catch(console.warn)
}

Notifier.pubEnt = function (ent, msg){
    let channel;
    ent = ent.toLowerCase().replace(' ', '_');
    open.then((conn) => {
            connection = conn;
            return conn.createChannel()
        })
        .then((ch) => {
            channel = ch;
            ch.publish(exchange,'ent:'+ent, Buffer.from(JSON.stringify(msg)),{
                persistent: true
            });
        })
        .then(() => channel.close())
        .catch(console.warn)
}

function closeConnection () {
    connection.close();
}
