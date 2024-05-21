import { mongoose, Schema } from "mongoose";

const blogSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    coverImage: {
        type: String,
        required: [true, 'Cover image is required']
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true
});

blogSchema.pre("save", async function (next) {
    if (!this.isModified("title") && !this.isModified("description")) return next();
    next();
});

blogSchema.methods.getSummary = function () {
    return {
        title: this.title,
        description: this.description.substring(0, 100) + '...',
        coverImage: this.coverImage,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

export const Blog = mongoose.model("Blog", blogSchema);
