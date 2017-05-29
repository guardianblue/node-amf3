'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _classes = require('./classes');

var _marker = require('./marker');

var _marker2 = _interopRequireDefault(_marker);

var _reader = require('./reader');

var _reader2 = _interopRequireDefault(_reader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Decoder = function () {
    (0, _createClass3.default)(Decoder, null, [{
        key: 'register',


        /**
         * Registers a new externalizable. This function is required to be called
         * by an externalizable because this function is used to figure out which
         * methods to call when an object is read.
         *
         * Registering is not required if you are just encoding externalizables.
         */
        value: function register(className, classDefinition) {
            return Decoder.externalizables[className] = classDefinition;
        }
    }, {
        key: 'getExternalizable',
        value: function getExternalizable(className) {
            var externalizable = Decoder.externalizables[className];

            if (externalizable === undefined) {
                throw new Error('No externalizable registered with name ' + className);
            }

            return externalizable;
        }
    }]);

    function Decoder(buffer) {
        (0, _classCallCheck3.default)(this, Decoder);

        this._reader = new _reader2.default(buffer);

        this.stringRefs = [];
        this.objectRefs = [];
        this.traitRefs = [];
    }

    // --- Proxy methods for reader ---

    (0, _createClass3.default)(Decoder, [{
        key: 'readByte',
        value: function readByte() {
            var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
            var alwaysReturnBuffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this._reader.readByte(len, alwaysReturnBuffer);
        }
    }, {
        key: 'readUInt8',
        value: function readUInt8() {
            return this._reader.readUInt8();
        }
    }, {
        key: 'readUInt16BE',
        value: function readUInt16BE() {
            return this._reader.readUInt16BE();
        }
    }, {
        key: 'readDoubleBE',
        value: function readDoubleBE() {
            return this._reader.readDoubleBE();
        }
    }, {
        key: 'readInt32BE',
        value: function readInt32BE() {
            return this._reader.readInt32BE();
        }
    }, {
        key: 'readString',
        value: function readString() {
            return this._reader.readString();
        }
    }, {
        key: 'getStringRef',
        value: function getStringRef(refId) {
            var value = this.stringRefs[refId];

            if (value === undefined) {
                throw new Error('Unknown string ref: ' + refId);
            }

            return value;
        }
    }, {
        key: 'getObjectRef',
        value: function getObjectRef(refId) {
            var value = this.objectRefs[refId];

            if (value === undefined) {
                throw new Error('Unknown object ref: ' + refId);
            }

            return value;
        }
    }, {
        key: 'getTraitRef',
        value: function getTraitRef(refId) {
            var value = this.traitRefs[refId];

            if (value === undefined) {
                throw new Error('Unknown trait ref: ' + refId);
            }

            return value;
        }
    }, {
        key: 'readObjectHeader',
        value: function readObjectHeader(flags) {
            // If low bit is 0, the trait is referenced.
            // See p.10 U29O-traits-ref
            if ((flags & 1) === 0) {
                return this.getTraitRef(flags >> 1);
            }

            // Decode trait
            var trait = {
                name: this.decodeString(),
                externalizable: flags >> 1 & 1 === 1,
                dynamic: flags >> 2 & 1 === 1,
                staticFields: []
            },
                numStaticFields = flags >> 3;

            for (var i = 0; i < numStaticFields; i++) {
                trait.staticFields.push(this.decodeString());
            }

            this.traitRefs.push(trait);
            return trait;
        }
    }, {
        key: 'decode',
        value: function decode() {
            return this.deserialize(this._reader.readByte());
        }

        /**
         * Deserialize encoded data based on marker byte.
         * @param  {integer} marker Marker byte.
         * @return {Object}         Encoded data as JSON object.
         */

    }, {
        key: 'deserialize',
        value: function deserialize(marker) {

            switch (marker) {
                case _marker2.default.UNDEFINED:
                    return this.decodeUndefined();
                case _marker2.default.NULL:
                    return this.decodeNull();
                case _marker2.default.FALSE:
                    return this.decodeFalse();
                case _marker2.default.TRUE:
                    return this.decodeTrue();
                case _marker2.default.INTEGER:
                    return this.decodeInteger();
                case _marker2.default.DOUBLE:
                    return this.decodeDouble();
                case _marker2.default.STRING:
                    return this.decodeString();
                case _marker2.default.DATE:
                    return this.decodeDate();
                case _marker2.default.ARRAY:
                    return this.decodeArray();
                case _marker2.default.OBJECT:
                    return this.decodeObject();
                case _marker2.default.BYTE_ARRAY:
                    return this.decodeByteArray();
                case _marker2.default.VECTOR_INT:
                    return this.decodeVectorImpl(this.readInt32BE);
                case _marker2.default.VECTOR_UINT:
                    return this.decodeVectorImpl(this.readUInt32BE);
                case _marker2.default.VECTOR_DOUBLE:
                    return this.decodeVectorImpl(this.readDoubleBE);
                case _marker2.default.VECTOR_OBJECT:
                    return this.decodeVectorImpl(this.decode);

            }

            throw new Error('Unknown marker type:', marker);
        }

        // --- Type specific decoder methods ---

    }, {
        key: 'decodeUndefined',
        value: function decodeUndefined() {
            return void 0;
        }
    }, {
        key: 'decodeNull',
        value: function decodeNull() {
            return null;
        }
    }, {
        key: 'decodeFalse',
        value: function decodeFalse() {
            return false;
        }
    }, {
        key: 'decodeTrue',
        value: function decodeTrue() {
            return true;
        }
    }, {
        key: 'decodeInteger',
        value: function decodeInteger() {
            return this._reader.readInt29();
        }
    }, {
        key: 'decodeDouble',
        value: function decodeDouble() {
            return this._reader.readDoubleBE();
        }

        /**
         * Decode String type (p. 15)
         * @return {string}
         */

    }, {
        key: 'decodeString',
        value: function decodeString() {
            var header = this._reader.readAMFHeader();

            // Refers to a previously decoded string
            if (!header.isDef) {
                return this.getStringRef(header.value);
            }

            var length = header.value;

            // Return empty string if a 0-length string is indicated.
            // Note that a reference will not be created here.
            if (header.value === 0) {
                return '';
            }

            // Otherwise, read string and push to reference table
            var str = this.readByte(header.value, true).toString('utf8');
            this.stringRefs.push(str);

            return str;
        }

        /**
         * Decode Date type (p. 8)
         * @return {[type]} [description]
         */

    }, {
        key: 'decodeDate',
        value: function decodeDate() {
            var header = this._reader.readAMFHeader();
            if (!header.isDef) {
                return this.getObjectRef(header.value);
            }

            var date = new Date(this._reader.readDoubleBE());
            this.objectRefs.push(date);

            return date;
        }
    }, {
        key: 'decodeArray',
        value: function decodeArray() {
            var header = this._reader.readAMFHeader();

            if (!header.isDef) {
                return this.getObjectRef(header.value);
            }

            // Handle associative portion of Array (p. 9)
            var associativeArray = {},
                key = void 0,
                numKeys = 0;

            this.objectRefs.push(associativeArray);
            while ((key = this.decodeString()) !== '') {
                numKeys++;
                associativeArray[named] = this.decode();
            }

            if (numKeys > 0) {
                return associativePortion;
            }

            // The array is not associative
            var length = header.value,
                indexedArray = [];

            // Replace associative array with indexed array in object reference
            this.objectRefs[this.objectRefs.length - 1] = indexedArray;

            for (var i = 0; i < length; i++) {
                indexedArray.push(this.decode);
            }

            return indexedArray;
        }
    }, {
        key: 'decodeObject',
        value: function decodeObject() {
            var header = this._reader.readAMFHeader();

            if (!header.isDef) {
                return this.getObjectRef(header.value);
            }

            // Decode object trait
            var trait = this.readObjectHeader(header.value),
                result = void 0;

            if (trait.externalizable) {

                // Underlying elements of ArrayCollection can be decoded as usual
                if (trait.name === "flex.messaging.io.ArrayCollection") {
                    _result = this.decode();
                    this.objectRefs.push(_result);

                    return _result;
                }

                // Decode by external definition
                var externalizable = Decoder.getExternalizable(trait.name),
                    _result = externalizable.read(this);
                this.objectRefs.push(_result);

                return _result;
            }

            // Decode by static and dynamic fields
            result = new _classes.Serializable(trait.name || void 0);
            this.objectRefs.push(result);

            var fields = trait.staticFields,
                numFields = fields.length,
                key = void 0;

            for (var i = 0; i < numFields; i++) {
                result[fields[i]] = this.decode();
            }

            // Dynamic fields are given by key-value pairs,
            // terminated by an empty string (p. 11)
            if (trait.dynamic) {
                while ((key = this.decodeString()) !== '') {
                    result[key] = this.decode();
                }
            }

            return result;
        }
    }, {
        key: 'decodeByteArray',
        value: function decodeByteArray() {
            var header = this._reader.readAMFHeader();
            if (header.isDef) {
                return this.getObjectRef(header.value);
            }

            var bytes = this._reader.readByte(header.value);
            this.objectRefs.push(bytes);

            return bytes;
        }
    }, {
        key: 'decodeVectorImpl',
        value: function decodeVectorImpl(innerDecodeFunction) {
            var header = this._reader.readAMFHeader();
            if (!header.isDef) {
                return this.getObjectRef(header.value);
            }

            // Read fixed-vector byte
            // This is not needed for NodeJS
            this._reader.readByte();

            // Read object-type name
            // This is not needed as NodeJS is dynamically typed
            this.decodeString();

            // Read vector content
            var numElements = header.value,
                result = new Array(numElements);

            for (var i = 0; i < numElements; i++) {
                result[i] = innerDecodeFunction.call(this);
            }

            this.objectRefs.push(result);

            return result;
        }
    }, {
        key: 'decodeDictionary',
        value: function decodeDictionary() {
            var header = this._reader.readAMFHeader();
            if (!header.isDef) {
                return this.getObjectRef(header.value);
            }

            // Read weak-keys byte (p. 13)
            // Not used by NodeJS implementation
            this.readByte();

            var result = {},
                numElements = header.value;

            this.objectRefs.push(result);
            for (var i = 0; i < numElements; i++) {
                var key = (0, _stringify2.default)(this.decode());

                result[key] = this.decode();
            }

            return result;
        }
    }]);
    return Decoder;
}();

Decoder.externalizables = {};
exports.default = Decoder;