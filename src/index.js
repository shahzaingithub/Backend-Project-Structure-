import dotenv from 'dotenv';
import connectionDb from '../Db/index.js';

import app from '../app.js';


dotenv.config({
    path:'./.env'
});
connectionDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((error)=>{
    console.log(`Mongodb Connection Failed ${error}`);
})  

