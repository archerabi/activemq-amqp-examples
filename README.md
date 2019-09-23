# activemq-amqp-examples

These examples illustrate the use of AMQP connections to read/write to Activemq. 

* download and run activemq (https://activemq.apache.org/components/classic/download/)
* For any of the examples, use `DEBUG=rhea:frames`, to see the AMQP frames


## Sending

1. `node send/send.js` will send 10 messages to a queue named `example`. 


## Receiving

Prior to running these examples, make sure you run the send example above so that queue on activemq has messages to dispatch.

### default config `{ autoAccept: true, creditWindow: 1 }`

_Command_

`DEBUG=rhea:frames node receive/receive.js`

When autoAccept is true, the client automatically sends `disposition` frames so that the broker/sender can mark the messages as received.

_Output_
```
rhea:frames [connection-1]:0 -> flow#13 {"incoming_window":2048,"outgoing_window":4294967295,"link_credit":1}  +1ms
rhea:frames [connection-1]:0 <- transfer#14 {"delivery_tag":{"type":"Buffer","data":[0]}} <Buffer 00 53 70 45 00 53 73 d0 00 00 00 06 00 00 00 01 53 02 00 53 77 d1 00 00 00 10 00 00 00 02 a1 08 73 65 71 75 65 6e 63 65 52 02> +1ms
{"sequence":2}
rhea:frames [connection-1]:0 -> disposition#15 {"role":true,"settled":true,"state":[]}  +2ms
rhea:frames [connection-1]:0 -> flow#13 {"next_incoming_id":1,"incoming_window":2048,"outgoing_window":4294967295,"delivery_count":1,"link_credit":1}  +0ms

```

creditWindow is the size of the window that controls flow of messages, much like TCP. Since the default size is 1, the broker sends 1 message at a time.
The "pending message" count on the broker goes down and the messages are removed off the queue.

--- 
### disable autoAccept `{ autoAccept: false, creditWindow: 1 }` 

_Command_

`DEBUG=rhea:frames node receive/receive.js -a false`

_Output_

```
  rhea:frames [connection-1]:0 -> flow#13 {"incoming_window":2048,"outgoing_window":4294967295,"link_credit":1}  +1ms
  rhea:frames [connection-1]:0 <- transfer#14 {"delivery_tag":{"type":"Buffer","data":[0]}} <Buffer 00 53 70 45 00 53 73 d0 00 00 00 06 00 00 00 01 53 02 00 53 77 d1 00 00 00 10 00 00 00 02 a1 08 73 65 71 75 65 6e 63 65 52 02> +2ms
{"sequence":2}
  rhea:frames [connection-1]:0 -> flow#13 {"next_incoming_id":1,"incoming_window":2047,"outgoing_window":4294967295,"delivery_count":1,"link_credit":1}  +2ms
  rhea:frames [connection-1]:0 <- transfer#14 {"delivery_id":1,"delivery_tag":{"type":"Buffer","data":[1]}} <Buffer 00 53 70 45 00 53 73 d0 00 00 00 06 00 00 00 01 53 03 00 53 77 d1 00 00 00 10 00 00 00 02 a1 08 73 65 71 75 65 6e 63 65 52 03> +0ms
{"sequence":3}
``` 
There is no disposition frame sent after messages are received. Though the messages are delivered to the client, if you check the broker, the "pending message" count doesn't change and the messages are still on the queue.

The client is responsible for acknowledging messages. This can be done like so

```
receiver.on('message', async context => {
    context.delivery.accept() // or context.delivery.reject(err)
});
```

---
### disable autoAccept and set creditWindow to 0 `{ autoAccept: false, creditWindow: 0 }`
_Command_

`DEBUG=rhea:frames node receive/receive.js -a false -c 0`

_Output_
```
  rhea:frames [connection-1]:0 <- open#10 {"container_id":"localhost","max_frame_size":131072,"channel_max":32767,"idle_time_out":15000,"offered_capabilities":["ANONYMOUS-RELAY","DELAYED_DELIVERY"],"properties":{"product":"ActiveMQ","topic-prefix":"topic://","queue-prefix":"queue://","version":"5.15.8","platform":"Java/1.8.0_201"}}  +1ms
  rhea:frames [connection-1]:0 <- begin#11 {"next_outgoing_id":1,"incoming_window":16383,"outgoing_window":2147483647,"handle_max":65535}  +0ms
  rhea:frames [connection-1]:0 <- attach#12 {"name":"ee0cf051-ea57-4c4d-afcb-fb981d65418b","snd_settle_mode":2,"source":["examples",2,"never"],"target":[]}  +1ms
```

After the client is has opened the connection, no messages flow from the broker. This is because the creditWindow size is 0. It is the broker's responsibility to increment set the creditWindow size as an when required. This can be done by calling `receiver.flow(1);`. Where receiver is the result of `open_receiver()`