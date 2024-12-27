//Playlists routes
const express = require('express');
const mongoose= require('mongoose');
const playlist = require("../models/playlist");
const content = require("../models/content");
const authMiddleware = require("../auth/auth-middleware");
const routerPlaylist = express.Router();

routerPlaylist.post("/playlist", authMiddleware, async (req,res) => {
    try{
        const { userId, name, contentArray } = req.body;

        if(!userId || !name) {
            return res.status(400).json({msg: "userId and name are required!"});
        }

        const existingPlaylist = await playlist.findOne({userId, name});
        if(existingPlaylist) {
            return res.status(400).json({msg: "A playlist with this name already exists!"})
        }

        const newPlaylist = new playlist({
            userId,
            name,
            contentArray: contentArray || []
        });

        await newPlaylist.save();
        res.status(200).json({msg: "Playlist is successfully saved!"})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Unable to create playlist", playlist: newPlaylist});
    }
});

routerPlaylist.get("/playlist", async (req,res) => {
    try {
        const { userId } = req.query;

        if(!userId) {
            return res.status(400).json({msg: "No userId found!"});
        }
        const playlists = await playlist.find({userId});

        if(!playlists || playlists.length === 0){
            return res.status(400).json({msg: "No Playlist Created yet or found"})
        }

        for (let playlist of playlists) {
            const validContent = await content.find({
                _id: { $in: playlist.contentArray.map(item => item.contentId) }
            }).select('_id');

            const validContentIds = validContent.map(c => c._id.toString());
            playlist.contentArray = playlist.contentArray.filter(item =>
                validContentIds.includes(item.contentId.toString())
            );
            await playlist.save();
        }

        res.status(200).json(playlists);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Unable to update tha playlist"});
    }   
});

routerPlaylist.put("/playlist/:id/content", async (req,res) => {
    try {
        const { id } = req.params;
        const { contentId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(contentId)) {
            return res.status(400).json({ msg: "Invalid PlaylistId or contentId" });
        }

        const contentObjectId = new mongoose.Types.ObjectId(contentId);
        const playlistData = await playlist.findById(id);
        const contentData = await content.findById(contentObjectId);

        if (!playlistData) return res.status(404).json({ msg: "Playlist not found" });
        if (!contentData) return res.status(404).json({ msg: "Content not found" });

        playlistData.contentArray.push({contentId: contentObjectId});
        await playlistData.save();

        if (!contentData.playlists) {
            contentData.playlists = [];
        }

        contentData.playlists.push(id);
        contentData.hasPlaylists = true;

        await contentData.save();
        res.status(200).json({ msg: "content added to playlist! ", updatedPlaylist: playlistData, updatedContent: contentData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Unable to get playlists!" });
    }
});

routerPlaylist.put("/playlist/:playlistId/content/:contentId", async (req, res) => {
    try {
        const { playlistId, contentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(contentId)) {
            return res.status(400).json({ msg: "Invalid PlaylistId or ContentId" });
        }

        const playlistFind = await playlist.findById(playlistId);
        if (!playlistFind) return res.status(404).json({ msg: "Playlist not found" });

        playlistFind.contentArray = playlistFind.contentArray.filter(
            (item) => item.contentId.toString() !== contentId
        );
        await playlistFind.save();

        const contentData = await content.findById(contentId);
        if (contentData) {
            contentData.playlists = contentData.playlists.filter(
                (id) => id.toString() !== playlistId
            );
            if (contentData.playlists.length === 0) contentData.hasPlaylists = false;
            await contentData.save();
        }

        res.status(200).json({ msg: "Content removed from playlist", updatedPlaylist: playlistFind });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Failed to remove content from playlist" });
    }
});

//Get content
routerPlaylist.post("/playlist/contents", async (req,res) => {
    try {
        const { playlistItems } = req.body;

        if (!Array.isArray(playlistItems) || playlistItems.length === 0) {
            return res.status(400).json({msg: "Invalid or empty contentIds array!"})
        }

        const objectIds = playlistItems.map(item => new mongoose.Types.ObjectId(item.contentId));

        const contents = await content.find({ _id: { $in: objectIds}})
        res.status(200).json(contents.map(content => { 
            const item = playlistItems.find(item => item.contentId === content._id.toString());
            return {...content.toObject(), duration: item.duration}
        })); 
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Failed to fetch contents"})
    }
});

//Get one content, to use the url in player.
routerPlaylist.get('/playlist/:playlistId/content/:contentId', authMiddleware, async (req, res) => {
    try {
        const { playlistId, contentId } = req.params;

        if (!contentId || !playlistId) {
            return res.status(400).json({ msg: "ContentId and PlaylistId are required" });
        }

        const foundPlaylist = await playlist.findById(playlistId);
        if (!foundPlaylist) {
            return res.status(404).json({ msg: "Playlist not found"})
        }

        const foundContent = await content.findById(contentId);
        if (!foundContent) {
            return res.status(404).json({ msg: "Content not found in the playlist"});
        }

        res.status(200).json(foundContent); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error retrieving content" });
    }
});

//Uppdatera duration i content
routerPlaylist.put("/playlist/:playlistId/content/:contentId/duration", async (req,res) => {
    try {
        const { playlistId, contentId } = req.params;
        const { duration } = req.body;

        console.log(`Received PUT request: playlistId=${playlistId}, contentId=${contentId}, duration=${duration}`);

        if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(contentId)) {
            return res.status(400).json({msg: "Invalid or missing duration"});
        }
        if (!duration || typeof duration !== "number" || duration <=0) {
            return res.status(400).json({ msg: "Invalid or missing duration"});
        }

        const playlistFind = await playlist.findById(playlistId);
        if (!playlistFind) return res.status(404).json({msg: "Playlist not found"});

        const playlistItem = playlistFind.contentArray.find((item) => item.contentId.toString() === contentId);
        if(!playlistItem) {
            return res.status(404).json({msg: "No content found in playlist"});
        }

        playlistItem.duration = duration;
        playlistFind.markModified("contentArray");
        await playlistFind.save();

        res.status(200).json({
            msg: "Duration updated!"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to update duration"});
    }
})

//Update playlist name!
routerPlaylist.put("/playlist/:id/name", async (req,res) => {
    try{
        const { id } = req.params;
        const { name } =req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({msg: "Invalid name"});
        }

        const playlistToUpdate = await playlist.findById(id);

        if(!playlistToUpdate) {
            return res.status(404).json({msg: "Playlist not found"});
        }

        playlistToUpdate.name = name.trim();
        
        await playlistToUpdate.save();
        res.status(200).json({msg: "Playlist name updated", updatedPlaylist: playlistToUpdate})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Failed to update playlist name"});
    }
});

routerPlaylist.delete("/playlist/:id", async (req,res) => {
    try {
        const playlistId = req.params.id;
        console.log(playlistId);

        const deletedPlaylist = await playlist.findByIdAndDelete(playlistId);

        if(!deletedPlaylist) {
            return res.status(404).json({msg: "Playlist not found"});
        }

        res.status(200).json({msg: "Playlist successfully deleted!"})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Unable to delete playlist"})
    }
})

module.exports = routerPlaylist;