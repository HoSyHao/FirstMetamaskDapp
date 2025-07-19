import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage }) => {
  const maxVisiblePages = 10;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const delta = Math.floor(maxVisiblePages / 2) - 1;

      if (currentPage - delta > 2) {
        pages.push('...');
      }

      let start = Math.max(2, currentPage - delta);
      let end = Math.min(totalPages - 1, currentPage + delta);

      if (currentPage - delta <= 2) {
        end = Math.min(maxVisiblePages - 1, totalPages - 1);
      }
      if (currentPage + delta >= totalPages - 1) {
        start = Math.max(2, totalPages - maxVisiblePages + 2);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage + delta < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    totalPages > 1 && (
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
          Previous
        </button>
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} ${typeof page !== 'number' ? 'cursor-default text-gray-400' : ''}`}
            disabled={typeof page !== 'number'}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
          Next
        </button>
      </div>
    )
  );
};

export default Pagination;