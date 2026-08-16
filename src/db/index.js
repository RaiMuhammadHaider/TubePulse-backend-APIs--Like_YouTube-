import mongoose from "mongoose"
import dns from "node:dns"
import { DB_NAME } from "../constants.js"

// The local DNS resolver (127.0.0.1) refuses Atlas SRV queries on this machine.
// Use public resolvers so mongodb+srv URLs can resolve normally.
dns.setServers(["1.1.1.1", "8.8.8.8"])

const connectDB = async () => {
    try {
        let connectionUrl = process.env.MONGODB_URL;
        if (connectionUrl.includes('?')) {
            const parts = connectionUrl.split('?');
            const baseUrl = parts[0].endsWith('/') ? parts[0] : `${parts[0]}/`;
            connectionUrl = `${baseUrl}${DB_NAME}?${parts[1]}`;
        } else {
            const baseUrl = connectionUrl.endsWith('/') ? connectionUrl : `${connectionUrl}/`;
            connectionUrl = `${baseUrl}${DB_NAME}`;
        }

        const connectionHost = await mongoose.connect(connectionUrl) //mongoDB Url + Our data base name 
        console.log(`MongoDB Connected : Host on ${connectionHost.connection.host}`)
        // console.log("checxccdcdcdking ", connectionHost)
        console.log("Connection URL:", connectionUrl)
        console.log("DB Name:", connectionHost.connection.name);
        console.log("Host:", connectionHost.connection.host);
    } catch (error) {
        console.log(`MongoDB Connection Error : ${error} `);
        console.log("haider error", process.env.MONGODB_URL)
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is missing from the .env file")
        }

        // dbName works with both a base Atlas URI and a URI that already has a path.
        // It avoids creating an invalid double slash before the database name.
        const connection = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: DB_NAME,
        })

        console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`)
    } 
}

export default connectDB
