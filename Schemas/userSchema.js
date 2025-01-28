const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    email:{
        type:String,
        require:true
    },
    name:{
        type:String,
        require:true

    },
    password:{
        type:String,
        require:true

    },
    phone:{
          type: Number, 
          required: true 
    }
})

module.exports = mongoose.model('User',userSchema);