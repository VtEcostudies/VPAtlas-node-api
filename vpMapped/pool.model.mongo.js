const mongoose = require('mongoose');
const pSchema = mongoose.Schema;

const pschema = new pSchema({
    poolID: { type: String, unique: true, required: true },
    poolUser: { type: String, required: true },
    lat: { type: String, required: true },
    lon: { type: String, required: true },
    createdDate: { type: Date, default: Date.now }
});

pschema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pool', pschema);