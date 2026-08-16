import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 9000 , ()=>{
        console.log(`Port is listening at ${process.env.PORT}`);
        
    })
    app.on('error' , (error)=>{
        console.log(`Error Found ! : ${error} `);
        
    })
    
}).catch((error)=>{
    console.log(`MongoDB Connection Failed !!  ${error}`);
    
}) // connect MongoDB
