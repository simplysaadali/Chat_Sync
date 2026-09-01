import mongoose from "mongoose";

const url = process.env.DB_URL;

async function connectDB (){
    try {
        await mongoose.connect(url);
        console.log("Connected to the DB successfully");
    } catch (error) {
        console.error("Error connecting to the Data Base: ", error);
    }
}

export default connectDB;