const mongoose=require('mongoose');
const CalendarSchema=new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'TeacherProfile',required:true},
    availability: [
        {
            day: { 
                type: String, 
                enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], 
                required: true 
            },
            slots: [
                { type: Boolean } // 48 boolean values for 30-minute slots (24 hours * 2 slots per hour)
            ]
        }
    ]
})
const CalendarModel=mongoose.model('Calendar',CalendarSchema)
module.exports=CalendarModel