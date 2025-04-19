const WithdrawForm = ({ withdrawAmount, setWithdrawAmount, withdraw, isLoading }) => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-200">Withdraw ETH</h3>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount in ETH"
            step="0.01"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            disabled={isLoading}
          />
          <button
            onClick={withdraw}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition duration-200 disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>
      </div>
    );
  };
  
  export default WithdrawForm;