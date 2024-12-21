const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');        //passport-local-mongoose will create a username and password automatically.


const userSchema=new Schema({
    email:{
        type:String,
        required:true,
    },
    course:{
        type:String,
        required:true,
    },
});

userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model('User',userSchema );