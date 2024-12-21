const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    submittedBy: { 
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;