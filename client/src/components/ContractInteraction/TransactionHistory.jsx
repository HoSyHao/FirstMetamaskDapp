const TransactionHistory = ({ transactions }) => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-200">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto bg-gray-700 p-4 rounded-lg">
            {transactions.map((tx, index) => (
              <li
                key={index}
                className={`text-sm border-b border-gray-600 pb-2 flex items-center gap-2 ${
                  tx.status === 'success' ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {tx.status === 'success' ? (
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="font-semibold capitalize">{tx.type}</span> - Hash:{' '}
                <a
                  href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                </a>
                {tx.value && ` - ${tx.value} ETH`} - {new Date(tx.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default TransactionHistory;