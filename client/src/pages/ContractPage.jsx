import ContractInteraction from '../components/ContractInteraction/ContractInteraction';
import ErrorBoundary from '../components/ErrorBoundary';

const ContractPage = () => (
  <div className="max-w-4xl mx-auto px-4">
    <div className="mt-10 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 border border-gray-700">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 text-center">
        Contract Interaction
      </h2>
      <ContractInteraction />
    </div>
    <ErrorBoundary />
  </div>
);

export default ContractPage;