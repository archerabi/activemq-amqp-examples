const yargs = require('yargs')
    .option('autoAccept', {
        alias: 'a',
        type: 'boolean',
        description: 'Auto accept messages',
        default: true,
    })
    .option('creditWindow', {
        alias: 'c',
        type: 'number',
        description: 'the size of the flow control window',
        default: 1,
    })
const container = require('rhea')

const { autoAccept, creditWindow } = yargs.argv
console.log({autoAccept, creditWindow});

var received = 0
var expected = 10

container.on('message', function(context) {
    if (context.message.id && context.message.id < received) {
        return
    }
    if (expected === 0 || received < expected) {
        console.log(JSON.stringify(context.message.body))
        if (++received === expected) {
            context.receiver.detach()
            context.connection.close()
        }
    }
})

container
    .connect({
        port: 5672,
        host: 'localhost',
        username: 'admin',
        password: 'admin',
    })
    .open_receiver({
        source: {
            address: 'examples',
            durable: 2,
            expiry_policy: 'never',
        },
        autoaccept: autoAccept,
        credit_window: creditWindow,
    })
