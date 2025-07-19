require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  origin: process.env.ORIGIN,
  subgraphEndpoint: process.env.SUBGRAPH_ENDPOINT,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretApiKey: process.env.PINATA_SECRET_API_KEY,
    jwt: process.env.PINATA_JWT,
    gateway: process.env.PINATA_GATEWAY
  },
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS
};