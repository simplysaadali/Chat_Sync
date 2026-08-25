import mongoose from "mongoose";

async function connectDB (){
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to the DB successfully");
}

export default connectDB;