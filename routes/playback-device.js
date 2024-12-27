const express = require('express');
const playerRouter = express.Router();
const content = require('../models/content');
const path = require('path');

playerRouter.get('/media-data', async (req,res) => {
    try {
        res.sendFile(path.join(__dirname, 'media-service/media-player', 'index.html'));

    } catch (error) {
        console.log("Error fetching media files: ", error);
        res.status(500).json({error: "Failed to fetch media files"});
    }
})

playerRouter.get('/media/:id', async (req,res) => {
    try{
        const { id } = req.params;

        const mediaFile = await content.findById(id);

        if(!mediaFile) {
            return res.status(404).json({ error: "Media file not found "});
        }

        res.status(200).json(mediaFile);
    } catch (error) {
        console.log("Error fetching file: ", error);
        res.status(500).json({error: "Failed to fetch media file"})
    }
});

playerRouter.get('/playlist/:playlistId/media', async (req,res) => {
    try {
        const { playlistId } = req.params;

        const mediaFiles = await content.find({playlists: playlistId});

        if(mediaFiles.length === 0) {
            return res.status(404).json({ error: "No media files found for this playlist"});
        }
        res.status(200).json(mediaFiles);
    } catch (error) {
        console.log("Error fetching playlist media: ", error);
    }
})

module.exports = playerRouter;