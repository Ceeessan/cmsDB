const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
    },
    contentArray: [{
        contentId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'content',
            required: true
        },
        duration: {
            type: Number,
            default: 10,
            required: false,
        }
    }]
    , timestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("playlist", playlistSchema);