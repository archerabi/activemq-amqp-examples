var container = require('rhea')

var confirmed = 0,
    sent = 0
var total = 10

container.on('sendable', function(context) {
    while (context.sender.sendable() && sent < total) {
        sent++
        console.log('sent ' + sent)
        context.sender.send({ message_id: sent, body: { sequence: sent } })
    }
})
container.on('accepted', function(context) {
    if (++confirmed === total) {
        console.log('all messages confirmed')
        context.connection.close()
    }
})
container.on('disconnected', function(context) {
    if (context.error) console.error('%s %j', context.error, context.error)
    sent = confirmed
})

container
    .connect({
        port: 5672,
        host: 'localhost',
        username: 'admin',
        password: 'admin',
    })
    .open_sender({ target: 'examples' })
