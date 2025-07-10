const express = require('express');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const { initializeSocket } = require('./socket');

const app = express();
const httpServer = require('http').createServer(app);
const { io } = initializeSocket(httpServer);

app.use(cors({
  origin: [process.env.ORIGIN],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
})) 

app.use(express.json());
app.use('/api', marketplaceRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});