const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    createdName: {
        type: String,
        default: ''
    },
    type : {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    fileurl: {
        type:String,
        required:true
    },
    timestamp: {
        type: Date,
        default: Date.now()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 10,
        max: 600
    },
    hasPlaylists: {
        type: Boolean,
        default: false
    },
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'playlist',
    }]
});

contentSchema.pre('save', function (next) {
    if (!this.hasPlaylists) {
        this.playlists = [];
    }
    next();
})

module.exports = mongoose.model("content", contentSchema);