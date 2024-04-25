import mongoose from "mongoose";

const connectionDb = async () => {
    try {
        const connectdata = await mongoose.connect(process.env.MONGODDB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB connected: ${connectdata.connection.host}`);
    } catch (error) {
        console.log(`MongoDB connection error: ${error}`);
    }
}

export default connectionDb;
