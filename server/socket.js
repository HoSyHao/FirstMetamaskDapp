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
      const { type, userAddress, tokenId, listingId, price, seller, timestamp, sellerTransaction, buyerTransaction, buyerTokenURI } = data;
      console.log(`Received marketplace event: ${type} for ${userAddress}`, data);

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

      // Broadcast to all users including buyer
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
      });
      console.log(`Broadcasting ${type} to all clients`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return { io };
}

module.exports = { initializeSocket };