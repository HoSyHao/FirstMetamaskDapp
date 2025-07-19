import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { addTransaction, loadTransactionHistory } from '../../redux/slices/marketplace/transactionsSlice';
import { ethers } from 'ethers';
import { useInView } from 'react-intersection-observer';
import { socket } from '../../lib/socketClient';

const TransactionHistoryM = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.transactionM?.items || []);
  const total = useSelector((state) => state.transactionM?.total || 0);
  const loading = useSelector((state) => state.transactionM?.loading || false);
  const error = useSelector((state) => state.transactionM?.error || null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const { ref, inView, entry } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    dispatch(loadTransactionHistory({ page: 1, limit: itemsPerPage }));
  }, [dispatch]);

  useEffect(() => {
    if (inView && !loading && entry?.isIntersecting && page * itemsPerPage < total) {
      setPage((prev) => prev + 1);
      dispatch(loadTransactionHistory({ page: page + 1, limit: itemsPerPage }));
    }
  }, [inView, loading, page, dispatch, entry, total]);

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

  if (loading && page === 1) return <p className="text-center text-gray-400 animate-pulse">Loading transactions...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  const sortedItems = [...new Map(items.map(item => [item.id, item])).values()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const displayedItems = sortedItems.slice(0, page * itemsPerPage);

  return (
    <div className="relative">
      <h3 className="text-xl font-semibold text-blue-300 mb-4">Transaction History</h3>
      {displayedItems.length === 0 ? (
        <p className="text-center text-gray-500">No transactions yet.</p>
      ) : (
        <ul className="space-y-4" style={{ maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4a5568 transparent' }}>
          {displayedItems.map((tx, index) => {
            const priceInTBNB = tx.price ? ethers.formatEther(tx.price) : '0';
            return (
              <li key={`${tx.id}-${index}`} className="bg-gray-700 p-4 rounded-lg min-h-[150px]">
                <p>NFT Token ID: {(tx.listing && tx.listing.tokenId) ? tx.listing.tokenId : 'N/A'}</p>
                <p>Price: {priceInTBNB} tBNB</p>
                <p>Buyer: {(tx.buyer && typeof tx.buyer === 'string') ? `${tx.buyer.slice(0, 6)}...${tx.buyer.slice(-4)}` : tx.buyer || 'N/A'}</p>
                <p>Seller: {(tx.seller && typeof tx.seller === 'string') ? `${tx.seller.slice(0, 6)}...${tx.seller.slice(-4)}` : tx.seller || 'N/A'}</p>
                <p>Time: {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</p>
              </li>
            );
          })}
          {page * itemsPerPage < total && <div ref={ref} className="h-10" />}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistoryM;