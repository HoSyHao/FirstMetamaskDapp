const express = require('express');
const nftRoutes = require('./routes/nftRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [process.env.ORIGIN],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
})) 

app.use(express.json());
app.use('/api', nftRoutes);
app.use('/api', marketplaceRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});