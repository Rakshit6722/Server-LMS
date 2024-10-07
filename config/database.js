const mongoose = require('mongoose')
require('dotenv').config
const dbConnect = () =>{

        mongoose.connect(process.env.MONOGDB)
        .then(()=>console.log('database connected'))
        .catch(err=>{
            console.log(err)
            console.log("database connection failed")
            process.exit(1);
        })
}

module.exports = dbConnect