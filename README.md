# node-amf3
AMF (ActionScript Message Format) Version 3 library for Node.js

This library is based on [ProjectCryo's AMF.js project](https://github.com/ProjectCryo/AMF.js)

# Installation

    npm install [--save] node-amf3

# Usage
- __Encoding__

Coming soon

- __Decoding__

```javascript
var Decoder = require('node-amf3').Decoder;

fs.readFile(file, function(err, data) {
    const decoder = new Decoder(data);
    const result = decoder.decode();

    console.log(result);
});
```

- __Custom Externalizables__
Simply extend the Externalizable class and register it in the decoder to allow for the custom encoding of objects. The `write` method will be called whenever an Externalizable needs to be encoded and the `this` value will be set to the encoder. The static `read` method will be called whenever an object with the Externizable's class is found. As with `write`, while invoking `read` the `this` value is set to the decoder.

```javascript
var NodeAMF = require('node-amf3'),
    Externalizable = NodeAMF.Externalizable;

class MyModel extends Externalizable {

    constructor() {
        super("name.of.the.model");
    }

    write(writable) {
        writable.write(this.value);
    }

    static read(decoder) {
        var model = new MyModel();
        model.value = decoder.readByte();

        return model;
    }
}

//Register the externalizable
Decoder.register("name.of.the.model", MyModel);
```
