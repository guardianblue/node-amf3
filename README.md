# node-amf3
AMF (ActionScript Message Format) Version 3 library for Node.js

This library is based on [ProjectCryo's AMF.js project](https://github.com/ProjectCryo/AMF.js)

# Installation

    npm install [--save] node-amf3

# AMF0 support

AMF0 **is not** supported by this library.

# Usage

## Encoding

Coming soon

## Decoding

```javascript
var Decoder = require('node-amf3').Decoder;

fs.readFile(file, function(err, data) {
    const decoder = new Decoder(data);
    const result = decoder.decode();

    console.log(result);
});
```

## Custom Externalizables
Simply extend the Externalizable class and register it in the decoder to allow for the custom encoding of objects.

* Pass the fully qualified name to the constructor
* The static `read` method will be called whenever an object with the Externizable's class is found.

```javascript
import { Decoder, Externalizable } from 'node-amf3';

class MyModel extends Externalizable {

    constructor() {
        super("name.of.the.model");
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
