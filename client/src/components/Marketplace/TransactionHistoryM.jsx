import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { addTransaction, loadTransactionHistory } from '../../redux/slices/marketplace/transactionsSlice';
import { ethers } from 'ethers';
import { socket } from '../../lib/socketClient';

const TransactionHistoryM = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => {
    console.log('Transaction state:', state.transactionM);
    const transactionsState = state.transactionM || { items: [], loading: false, error: null };
    return {
      items: transactionsState.items || [],
      loading: transactionsState.loading || false,
      error: transactionsState.error || null,
    };
  });

  useEffect(() => {
    const handleMarketplaceUpdate = (data) => {
      const { type, sellerTransaction, buyerTransaction } = data;
      if (type === 'ItemSold') {
        if (sellerTransaction) {
          const parsedSellerTransaction = typeof sellerTransaction === 'string' ? JSON.parse(sellerTransaction) : sellerTransaction;
          dispatch(addTransaction(parsedSellerTransaction));
        }
        if (buyerTransaction) {
          const parsedBuyerTransaction = typeof buyerTransaction === 'string' ? JSON.parse(buyerTransaction) : buyerTransaction;
          dispatch(addTransaction(parsedBuyerTransaction));
        }
      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadTransactionHistory());
  }, [dispatch]);

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading transactions...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold text-blue-300 mb-4">Transaction History</h3>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">No transactions yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((tx) => {
            const priceInTBNB = tx.price ? ethers.formatEther(tx.price) : '0';
            return (
              <li key={tx.id} className="bg-gray-700 p-4 rounded-lg">
                <p>NFT Token ID: {(tx.listing && tx.listing.tokenId) ? tx.listing.tokenId : 'N/A'}</p>
                <p>Price: {priceInTBNB} tBNB</p>
                <p>Buyer: {(tx.buyer && typeof tx.buyer === 'string') ? `${tx.buyer.slice(0, 6)}...${tx.buyer.slice(-4)}` : tx.buyer || 'N/A'}</p>
                <p>Seller: {(tx.seller && typeof tx.seller === 'string') ? `${tx.seller.slice(0, 6)}...${tx.seller.slice(-4)}` : tx.seller || 'N/A'}</p>
                <p>Time: {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistoryM;