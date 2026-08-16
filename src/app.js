import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from "dotenv"
import cors from 'cors'
dotenv.config({
    path: "./.env",
    quiet: true,
})
const app = express()
app.use(cors({
    credentials : true,
    origin : process.env.CORS_ORIGIN, // hm yahan sy allow krty hn k kis kis ko allow krna ha cros origin k liya 
    credentials : true
}))
app.use(express.json({ //how much limit allow to get 
    limit : "16kb"
}))
app.use(express.urlencoded({ // ya is liya jb url sy yani params sy data ay ga tu ya kitny allow kry ga 
    limit : "16kb",
    extended : true
}))
app.use(express.static("static"))
app.use(cookieParser())



// router
import userRouter from './routes/user.route.js'
app.use('/api/v1/user' , userRouter) // standard practice
export {app}
