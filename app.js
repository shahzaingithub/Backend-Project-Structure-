import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// json main data 14 kb limit
app.use(express.json({limit:'14kb'}));
// url encoded data 14 kb limit
app.use(express.urlencoded({extended:true,limit:'14kb'}));
// cookie parser for cookies    
app.use(cookieparser());


// routes 
import userRoutes from './routes/user.routes.js';

// routes users 
app.use("/api/v1/users",userRoutes)





export default app