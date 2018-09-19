const express = require('express');
const router = express.Router();
const adminAuth = require('../../../middlewares/adminAuth');
const Note = require('../../../models/Note').Note;
const {LogError,errorMessages} = require('../../../config/common');

router.post('/', adminAuth, async (req, res) => {
    let to = req.body.to;
    let from = req.user._id;
    let thenote = req.body.note;

    try {
        let _note = new Note({
            to,
            from,
            note:thenote,
            created: Date(),
            notes: [],
            isRoot: true
        });
        
        let note = await _note.save();
        
        let data = {
            success: true,
            message: "Successfully created new note!",
            note
        }
        return res.json(data);
    }
    catch (error) {
        LogError(error,req);
        return res.json({success:false,message:errorMessages.generic500});
    }

});

//Leave a note on a note that already exists
router.post('/:id/note', adminAuth, async (req, res) => {

    try {
        let _id = req.params.id;
        let _replyeeNote = await Note.findOne({_id});
    
        let _replyerNote = new Note();
        _replyerNote.to = req.body.to;
        _replyerNote.from = req.user._id;
        _replyerNote.note = req.body.note;
        _replyerNote.created = Date();
        _replyerNote.notes = [];
        _replyerNote.isRoot = false;
        let replyerNote = await _replyerNote.save();
    
        _replyeeNote.notes.push(replyerNote._id);
        let replyeeNote = await _replyeeNote.save();
    
        return res.json({success:true,message:"Successfully added new note"});
    }
    catch (error) {
        LogError(error,req);
        return res.json({success:false,message:errorMessages.generic500});
    }
    
})



module.exports = router;