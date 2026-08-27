import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //User means User model, tells mongoDB what user is used here, in the ID
            required: true,
            index: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        // for future bot integration
        authorType: {
            type: String,
            enum: ["user", "bot"],
            default: "user",
            index: true,
        },
    },
    { timestamps: true },
);

//static means you're creating your own in schema model
messageSchema.statics.between = function (a, b) { 
  return this.find({
     //$or gives both ways send and receive, without this, it is not possible to send and receive from both sides
    $or: [
      { sender: a, receiver: b },
      { sender: b, receiver: a },
    ],
  })
    .sort({ createdAt: 1 }) //newest first
    .limit(150); //maximum nmber of messages to load
};

module.exports = mongoose.model("Message", messageSchema);