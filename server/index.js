const express = require('express');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const { initializeSocket } = require('./socket');
const config = require('./config/config');
const mongoose = require('mongoose');
const cronJobs = require('./cronJobs'); // Import file cronjob

const app = express();
const httpServer = require('http').createServer(app);
const { io } = initializeSocket(httpServer);

app.use(cors({
  origin: [config.origin],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/api', marketplaceRoutes);
app.use('/api', userRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ success: false, error: err.message });
});

// Kết nối Mongoose trước khi chạy server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = config.port;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Khởi chạy cronjob sau khi server chạy
      if (typeof cronJobs === 'function') {
        cronJobs(); // Nếu cronJobs export là function
      }
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = { app };