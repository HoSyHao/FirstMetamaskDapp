const { Server } = require('socket.io');

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('subscribe', (data) => {
      const { userAddress } = data;
      if (userAddress) {
        const normalizedAddress = userAddress.toLowerCase();
        socket.join(normalizedAddress);
        console.log(`User ${userAddress} subscribed with socket ${socket.id} to room ${normalizedAddress}`);
      }
    });

    socket.on('marketplaceEvent', (data) => {
      const { type, userAddress, tokenId, listingId, price, seller, timestamp, sellerTransaction, buyerTransaction, buyerTokenURI, metadata } = data;
      console.log(`Received marketplace event: ${type} for ${userAddress}`, data);

      if (userAddress) {
        const normalizedUserAddress = userAddress.toLowerCase();

        if (type === 'ItemSold' && seller) {
          const normalizedSeller = seller.toLowerCase();
          io.to(normalizedSeller).emit('marketplaceUpdate', {
            type,
            userAddress,
            tokenId,
            listingId,
            price,
            seller: normalizedSeller,
            timestamp,
            sellerTransaction,
          });
          console.log(`Broadcasting ItemSold to seller ${normalizedSeller} with data:`, {
            type,
            userAddress,
            tokenId,
            listingId,
            price,
            seller: normalizedSeller,
            timestamp,
            sellerTransaction,
          });
        }

        // Broadcast to all users including buyer for general events
        io.emit('marketplaceUpdate', {
          type,
          userAddress,
          tokenId,
          listingId,
          price,
          seller,
          timestamp,
          sellerTransaction,
          buyerTransaction,
          buyerTokenURI,
          metadata,
        });
        console.log(`Broadcasting ${type} to all clients`);

        // Notify specific user room for metadata updates
        if ((type === 'MetadataUpdated' || type === 'MetadataAdded') && userAddress && tokenId) {
          io.to(normalizedUserAddress).emit('marketplaceUpdate', {
            type,
            userAddress: normalizedUserAddress,
            tokenId,
            timestamp,
            metadata,
          });
          console.log(`Broadcasting ${type} to room ${normalizedUserAddress}`);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return { io };
}

module.exports = { initializeSocket };