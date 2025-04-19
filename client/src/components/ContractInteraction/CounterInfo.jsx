const CounterInfo = ({ counter, contractBalance, userBalance }) => {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-lg font-semibold text-blue-200">Counter</p>
          <p className="text-gray-300">{counter}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-lg font-semibold text-blue-200">Contract Balance</p>
          <p className="text-gray-300">{contractBalance} ETH</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-lg font-semibold text-blue-200">User Balance</p>
          <p className="text-gray-300">{userBalance} ETH</p>
        </div>
      </div>
    );
  };
  
  export default CounterInfo;