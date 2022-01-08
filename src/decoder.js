import {
    Externalizable,
    Serializable,
} from './classes';

import Marker from './marker';
import Reader from './reader';

export default class Decoder {

    static externalizables = {};

    /**
     * Registers a new externalizable. This function is required to be called
     * by an externalizable because this function is used to figure out which
     * methods to call when an object is read.
     *
     * Registering is not required if you are just encoding externalizables.
     */
    static register(className, classDefinition) {
        return Decoder.externalizables[className] = classDefinition;
    }

    static getExternalizable(className) {
        let externalizable = Decoder.externalizables[className];

        if (externalizable === undefined) {
            throw new Error('No externalizable registered with name ' + className);
        }

        return externalizable;
    }

    constructor(buffer) {
        this._reader = new Reader(buffer);

        this.stringRefs = [];
        this.objectRefs = [];
        this.traitRefs = [];
    }

    // --- Proxy methods for reader ---

    readByte(len = 1, alwaysReturnBuffer = false) {
        return this._reader.readByte(len, alwaysReturnBuffer);
    }

    readUInt8() {
        return this._reader.readUInt8();
    }

    readUInt16BE() {
        return this._reader.readUInt16BE();
    }

    readDoubleBE() {
        return this._reader.readDoubleBE();
    }

    readInt32BE() {
        return this._reader.readInt32BE();
    }

    readString() {
        return this._reader.readString();
    }

    getStringRef(refId) {
        let value = this.stringRefs[refId];

        if (value === undefined) {
            throw new Error('Unknown string ref: ' + refId);
        }

        return value;
    }

    getObjectRef(refId) {
        let value = this.objectRefs[refId];

        if (value === undefined) {
            throw new Error('Unknown object ref: ' + refId);
        }

        return value;
    }

    getTraitRef(refId) {
        let value = this.traitRefs[refId];

        if (value === undefined) {
            throw new Error('Unknown trait ref: ' + refId);
        }

        return value;
    }

    readObjectHeader(flags) {
        // If low bit is 0, the trait is referenced.
        // See p.10 U29O-traits-ref
        if ((flags & 1) === 0) {
            return this.getTraitRef(flags >> 1);
        }

        // Decode trait
        let trait = {
            name: this.decodeString(),
            externalizable: (flags >> 1) & 1 === 1,
            dynamic: (flags >> 2) & 1 === 1,
            staticFields: [],
        },
        numStaticFields = flags >> 3;

        for (let i = 0; i < numStaticFields; i++) {
            trait.staticFields.push(this.decodeString());
        }

        this.traitRefs.push(trait);
        return trait;
    }

    decode() {
        return this.deserialize(this._reader.readByte());
    }

    /**
     * Deserialize encoded data based on marker byte.
     * @param  {integer} marker Marker byte.
     * @return {Object}         Encoded data as JSON object.
     */
    deserialize(marker) {

        switch (marker) {
            case Marker.UNDEFINED:
                return this.decodeUndefined();
            case Marker.NULL:
                return this.decodeNull();
            case Marker.FALSE:
                return this.decodeFalse();
            case Marker.TRUE:
                return this.decodeTrue();
            case Marker.INTEGER:
                return this.decodeInteger();
            case Marker.DOUBLE:
                return this.decodeDouble();
            case Marker.STRING:
                return this.decodeString();
            case Marker.DATE:
                return this.decodeDate();
            case Marker.ARRAY:
                return this.decodeArray();
            case Marker.OBJECT:
                return this.decodeObject();
            case Marker.BYTE_ARRAY:
                return this.decodeByteArray();
            case Marker.VECTOR_INT:
                return this.decodeVectorImpl(this.readInt32BE);
            case Marker.VECTOR_UINT:
                return this.decodeVectorImpl(this.readUInt32BE);
            case Marker.VECTOR_DOUBLE:
                return this.decodeVectorImpl(this.readDoubleBE);
            case Marker.VECTOR_OBJECT:
                return this.decodeVectorImpl(this.decode);
            case Marker.DICTIONARY:
                return this.decodeDictionary();
        }

        throw new Error('Unknown marker type:', marker);
    }

    // --- Type specific decoder methods ---

    decodeUndefined() {
        return void 0;
    }

    decodeNull() {
        return null;
    }

    decodeFalse() {
        return false;
    }

    decodeTrue() {
        return true;
    }

    decodeInteger() {
        return this._reader.readInt29();
    }

    decodeDouble() {
        return this._reader.readDoubleBE();
    }

    /**
     * Decode String type (p. 15)
     * @return {string}
     */
    decodeString() {
        let header = this._reader.readAMFHeader();

        // Refers to a previously decoded string
        if (!header.isDef) {
            return this.getStringRef(header.value);
        }

        let length = header.value;

        // Return empty string if a 0-length string is indicated.
        // Note that a reference will not be created here.
        if (header.value === 0) {
            return '';
        }

        // Otherwise, read string and push to reference table
        let str = this.readByte(header.value, true).toString('utf8');
        this.stringRefs.push(str);

        return str;
    }

    /**
     * Decode Date type (p. 8)
     * @return {[type]} [description]
     */
    decodeDate() {
        let  header = this._reader.readAMFHeader();
        if (!header.isDef) {
            return this.getObjectRef(header.value);
        }

        let date = new Date(this._reader.readDoubleBE());
        this.objectRefs.push(date);

        return date;
    }

    decodeArray() {
        let header = this._reader.readAMFHeader();

        if (!header.isDef) {
            return this.getObjectRef(header.value);
        }

        // Handle associative portion of Array (p. 9)
        let associativeArray = {},
            key,
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
        let length = header.value,
            indexedArray = [];

        // Replace associative array with indexed array in object reference
        this.objectRefs[this.objectRefs.length - 1] = indexedArray;

        for (let i = 0; i < length; i++) {
            indexedArray.push(this.decode);
        }

        return indexedArray;
    }

    decodeObject() {
        let header = this._reader.readAMFHeader();

        if (!header.isDef) {
            return this.getObjectRef(header.value);
        }

        // Decode object trait
        let trait = this.readObjectHeader(header.value),
            result;

        if (trait.externalizable) {

            // Underlying elements of ArrayCollection can be decoded as usual
            if (trait.name === "flex.messaging.io.ArrayCollection") {
                result = this.decode();
                this.objectRefs.push(result);

                return result;
            }

            // Decode by external definition
            let externalizable = Decoder.getExternalizable(trait.name),
                result = externalizable.read(this);
                this.objectRefs.push(result);

            return result;
        }

        // Decode by static and dynamic fields
        result = new Serializable(trait.name || void 0);
        this.objectRefs.push(result);

        let fields = trait.staticFields,
            numFields = fields.length,
            key;

        for (let i = 0; i < numFields; i++) {
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

    decodeByteArray() {
        let header = this._reader.readAMFHeader();
        if (header.isDef) {
            return this.getObjectRef(header.value);
        }

        let bytes = this._reader.readByte(header.value);
        this.objectRefs.push(bytes);

        return bytes;
    }

    decodeVectorImpl(innerDecodeFunction) {
        let header = this._reader.readAMFHeader();
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
        let numElements = header.value,
            result = new Array(numElements);

        for (let i = 0; i < numElements; i++) {
            result[i] = innerDecodeFunction.call(this);
        }

        this.objectRefs.push(result);

        return result;
    }

    decodeDictionary() {
        let header = this._reader.readAMFHeader();
        if (!header.isDef) {
            return this.getObjectRef(header.value);
        }

        // Read weak-keys byte (p. 13)
        // Not used by NodeJS implementation
        this.readByte();

        let result = new Map(),
            numElements = header.value;

        this.objectRefs.push(result);
        for (let i = 0; i < numElements; i++) {
            let key = this.decode();

            result.set(key, this.decode());
        }

        return result;
    }

}
