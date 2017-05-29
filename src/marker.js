/**
 * List of Marker bytes
 * @see http://wwwimages.adobe.com/www.adobe.com/content/dam/Adobe/en/devnet/amf/pdf/amf-file-format-spec.pdf
 */
export default {
    UNDEFINED:      0x00,
    NULL:           0x01,
    FALSE:          0x02,
    TRUE:           0x03,
    INTEGER:        0x04,
    DOUBLE:         0x05,
    STRING:         0x06,
    XML_DOC:        0x07,
    DATE:           0x08,
    ARRAY:          0x09,
    OBJECT:         0x0a,
    XML:            0x0b,
    BYTE_ARRAY:     0x0c,
    VECTOR_INT:     0x0d,
    VECTOR_UINT:    0x0e,
    VECTOR_DOUBLE:  0x0f,
    VECTOR_OBJECT:  0x10,
    DICTIONARY:     0x11,
};
