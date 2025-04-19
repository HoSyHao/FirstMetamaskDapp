const ContractEvents = ({ events }) => {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-2 text-blue-200">Contract Events</h3>
        {events.length === 0 ? (
          <p className="text-gray-400">No events yet.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto bg-gray-700 p-4 rounded-lg">
            {events.map((event, index) => (
              <li key={index} className="text-sm border-b border-gray-600 pb-2">
                <span className="font-semibold text-blue-200">{event.type}</span> - User:{' '}
                {event.user.slice(0, 6)}...
                {event.newValue && ` - New Value: ${event.newValue}`}
                {event.amount && ` - Amount: ${event.amount} ETH`} -{' '}
                {new Date(event.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default ContractEvents;