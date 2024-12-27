// Content routes
const express = require("express");
const mongoose = require('mongoose');
const routerContent = express.Router();
const content = require("../models/content");
const authMiddleware = require('../auth/auth-middleware');
const {upload} = require('../config/multer');
const fs = require('fs');

routerContent.post("/content", authMiddleware, upload.single('file'), async (req, res) => {
    try{ 
        const {  type, userId, createdName, duration } = req.body;
        const file = req.file;
        if (!file || !type || !userId) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        const filePath = `./uploads/${file.filename}`;

        const timestamp = req.body.timestamp ? new Date(req.body.timestamp): new Date();
        const hasPlaylists = req.body.hasPlaylists == 'false';
        const playlists = req.body.playlists ? JSON.parse(req.body.playlists) : [];

        const newContent = new content({
            filename: file.filename,
            createdName,
            type,
            fileurl: filePath,
            timestamp,
            userId,
            duration: duration ? parseInt(duration,10) : 10,
            hasPlaylists,
            playlists
        });
        const saveContent = await newContent.save();
        console.log(saveContent);
        if(!res.headersSent) {
            res.status(201).json({msg: "Content is successfully saved!", saveContent: newContent})
        }
    }
        catch (error) {
            console.log(error);
            res.status(500).json({msg: "Unable to create new content"})
        }
    })

//GET all contents
routerContent.get("/content", async (req,res) => {
    const {userId} = req.query;

    if (!userId) {
        return res.status(400).json({ msg: "Missing userId in query parameters" });
    }
    try{
        const allContentFromUser = await content.find({ userId });

        if(!allContentFromUser || allContentFromUser.length === 0){
            return res.status(200).json({msg: "No content found", contents: []})
        }

        const baseUrl = "http://localhost:3000";
        const contentWithUrls = allContentFromUser.map((item) => {
            const itemObject = item.toObject();
            itemObject.fileurl = `${baseUrl}/uploads/${item.filename}`;
            return itemObject;
        });

        return res.status(200).json(contentWithUrls);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({msg: "Unable to get the content"})
    }
})

//GET one content
routerContent.get('/content/:id', authMiddleware, async (req, res) => {
    try {
        const contentId = req.params.id;

        if(!contentId) {
            return res.status(400).json({msg: "Content ID is required"});
        }

        const content = await content.findOne({ _id: contentId});

        if(!content) {
            return res.status(404).json({msg: "Content not found or not authorized"});
        }
        
        res.status(200).json({content})
    } catch(error) {
        console.log(error);
        res.status(500).json({msg: "Unable to get content"})
    }
})

//Update the content
routerContent.put('/content/:id', authMiddleware, async (req, res) => {
    try {
        console.log("Request body:", req.body); 
        const id = req.params.id;
        const updatedContentName = req.body.createdName;  

        if (!updatedContentName) {
            return res.status(404).json({msg: "Content not found"});
        }

        const contentToUpdate = await content.findByIdAndUpdate(id,
            {createdName: updatedContentName},
            {new: true}
        );
   
        res.status(200).json({content: contentToUpdate}) 
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Unable to update content"})
    }
})

//DELETE one content
routerContent.delete('/content/:id', async (req,res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid content ID');
          }

        const deleteContent = await content.findById(id)

        if(!deleteContent) {
            return res.status(404).json({msg: 'Content not fount'})
        }

        const filePath = `./uploads/${deleteContent.filename}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await content.findByIdAndDelete(id);
        res.status(200).json({msg: "Content deleted successfyllt!"});
    } catch(error) {
        console.log(error);
        res.status(500).json({msg: "Unable to delete content"});
    }
});

module.exports = routerContent;