"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * This class was originally written to provide proxy methods of that of Buffer.
 * However, the usage of ReadableStream would fail if the AMF message is large.
 * Therefore, this class is slightly modified to operate directly on a buffer instead.
 *
 * TODO: some of the methods can actually be simplified.
 */
class Reader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readByte(len = 1, alwaysReturnBuffer = false) {
    var read = this.buffer.slice(this.offset, this.offset + len);
    this.offset += len;

    if (read) {
      return read.length === 1 && !alwaysReturnBuffer ? read[0] : read;
    }

    throw new Error("No " + len + " bytes left");
  }

  readUInt8() {
    var read = this.readByte();

    if (read < 0) {
      read += 256;
    }

    return read;
  }

  readUInt16BE() {
    return this.readByte(2).readUInt16BE();
  }

  readDoubleBE() {
    return this.readByte(8).readDoubleBE();
  }

  readInt32BE() {
    return this.readByte(4).readInt32BE();
  }

  readUint32BE() {
    return this.readByte(4).readUint32BE();
  }

  readString() {
    var len = this.readUInt16BE();

    if (len === 0) {
      return '';
    }

    return this.readByte(len, true).toString('utf8');
  }

  readAMFHeader() {
    var handle = this.readInt29(),
        def = handle & 1 !== 0;
    handle >>= 1;
    return {
      isDef: def,
      value: handle
    };
  }

  readInt29() {
    var bit1, bit2, bit3, total;
    bit1 = this.readByte();

    if (bit1 < 128) {
      return bit1;
    }

    total = (bit1 & 0x7f) << 7;
    bit2 = this.readByte();

    if (bit2 < 128) {
      total |= bit2;
    } else {
      total = (total | bit2 & 0x7f) << 7;
      bit3 = this.readByte();

      if (bit3 < 128) {
        total |= bit3;
      } else {
        total = (total | bit3 & 0x7f) << 8;
        total |= this.readByte();
      }
    }

    return -(total & 1 << 28) | total;
  }

}

exports.default = Reader;