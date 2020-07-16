
var open = require('amqplib').connect('amqp://localhost');

var exchange = 'notificacoes'
var type = 'topic';

var Notifier = module.exports

Notifier.bind = function (usr, ent){

    let channel;
    let connection;
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
        .then(() => channel.bindQueue(usr,exchange, 'usr:'+usr))
        .then(() => channel.bindQueue(usr,exchange, 'ent:'+ent))
        .then(() => channel.close())
        .then(() => connection.close())
        .catch(console.warn)
}
   

Notifier.pubUsr = function (usr, msg){
    console.log('Notifier')

    let channel;
    let connection;
    usr = usr.toLowerCase().replace(' ', '_');
    open.then((conn) => {
            connection = conn;
            return conn.createChannel()
        })
        .then((ch) => {
            channel = ch;
            console.log(msg)
            msgBuffer = Buffer.from(JSON.stringify(msg), 'utf-8')
            ch.publish(exchange,'usr:'+usr, msgBuffer,{
                persistent: true
            })
        })
        .then(() => channel.close())
        .then(() => connection.close())
        .catch(console.warn)
}

Notifier.pubEnt = function (ent, msg){
    let channel;
    let connection;
    ent = ent.toLowerCase().replace(' ', '_');
    open.then((conn) => {
            connection = conn;
            return conn.createChannel()
        })
        .then((ch) => {
            channel = ch;
            ch.publish(exchange,'ent:'+ent, Buffer.from(msg),{
                persistent: true
            });
        })
        .then(() => channel.close())
        .then(() => connection.close())
        .catch(console.warn)
}
