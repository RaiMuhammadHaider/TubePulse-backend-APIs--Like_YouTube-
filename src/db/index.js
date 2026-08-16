import mongoose from "mongoose"
import dns from "node:dns"
import { DB_NAME } from "../constants.js"

// The local DNS resolver (127.0.0.1) refuses Atlas SRV queries on this machine.
// Use public resolvers so mongodb+srv URLs can resolve normally.
dns.setServers(["1.1.1.1", "8.8.8.8"])

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is missing from the .env file")
        }

        // dbName works with both a base Atlas URI and a URI that already has a path.
        // It avoids creating an invalid double slash before the database name.
        const connection = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: DB_NAME,
        })

        console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`)
    } catch (error) {
        console.error("MongoDB connection error:", error.message)
        throw error
    }
}

export default connectDB
