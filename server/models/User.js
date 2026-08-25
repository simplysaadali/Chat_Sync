import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minLength: 6,
            select: false,
        }
    },

    {
        timestamps: true,
    }
)

module.export = mongoose.model("User", userSchema); 