"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This class was originally written to provide proxy methods of that of Buffer.
 * However, the usage of ReadableStream would fail if the AMF message is large.
 * Therefore, this class is slightly modified to operate directly on a buffer instead.
 *
 * TODO: some of the methods can actually be simplified.
 */
var Reader = function () {
    function Reader(buffer) {
        (0, _classCallCheck3.default)(this, Reader);

        this.buffer = buffer;
        this.offset = 0;
    }

    (0, _createClass3.default)(Reader, [{
        key: "readByte",
        value: function readByte() {
            var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
            var alwaysReturnBuffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


            var read = this.buffer.slice(this.offset, this.offset + len);

            this.offset += len;

            if (read) {
                return read.length === 1 && !alwaysReturnBuffer ? read[0] : read;
            }

            throw new Error("No " + len + " bytes left");
        }
    }, {
        key: "readUInt8",
        value: function readUInt8() {
            var read = this.readByte();
            if (read < 0) {
                read += 256;
            }

            return read;
        }
    }, {
        key: "readUInt16BE",
        value: function readUInt16BE() {
            return this.readByte(2).readUInt16BE();
        }
    }, {
        key: "readDoubleBE",
        value: function readDoubleBE() {
            return this.readByte(8).readDoubleBE();
        }
    }, {
        key: "readInt32BE",
        value: function readInt32BE() {
            return this.readByte(4).readInt32BE();
        }
    }, {
        key: "readUint32BE",
        value: function readUint32BE() {
            return this.readByte(4).readUint32BE();
        }
    }, {
        key: "readString",
        value: function readString() {
            var len = this.readUInt16BE();
            if (len === 0) {
                return '';
            }

            return this.readByte(len, true).toString('utf8');
        }
    }, {
        key: "readAMFHeader",
        value: function readAMFHeader() {
            var handle = this.readInt29(),
                def = handle & 1 !== 0;

            handle >>= 1;

            return {
                isDef: def,
                value: handle
            };
        }
    }, {
        key: "readInt29",
        value: function readInt29() {
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
    }]);
    return Reader;
}();

exports.default = Reader;