const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs success or exits the process on failure.
 */
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('❌ CRITICAL: MONGO_URI is not defined in environment variables.');
            process.exit(1);
        }
        
        console.log('📡 Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
