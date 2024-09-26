import React, { useState } from 'react';
import { Result } from '@/main/model/result';
import Pagination from '@mui/material/Pagination';
import ClockIcon from '@/assets/icon/clock.svg';
import CarIcon from '@/assets/icon/car.svg';
import PlateIcon from '@/assets/icon/driving-license.svg';
import NoImage from '@/assets/noImage.png';

interface ViolationListProps {
  violations: Result[];
}

const ViolationList: React.FC<ViolationListProps> = ({ violations }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(violations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = violations.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div><div className="overflow-hidden overflow-y-auto" style={{ minHeight: '540px', maxHeight: '540px' }}>
      {currentItems.map((violation: Result) => (
        <div key={violation.id} className="card mb-3 pb-2.5">
          <div className="row no-gutters">
            <div className="col-3 pr-0">
              <img src={violation.url ? violation.url : NoImage} className="min-h-[90px] min-w-[90px] mt-2.5 ml-2.5 rounded-xl" alt="Vehicle" />
            </div>
            <div className="col-3 pr-0">
              <img src={violation.plate_url ? violation.plate_url : NoImage} className="min-h-[90px] min-w-[90px] mt-2.5 rounded-xl" alt="License plate" />
            </div>
            <div className="col-6 d-flex bd-highlight"> 
              <div className="me-auto p-2 bd-highlight align-items-center">
                <p className="card-text">
                  <img src={ClockIcon} alt="Clock Icon" className="inline-block w-4 h-4" />
                  <small className="text-muted px-2">{violation.timestamp}</small>
                  <br />
                  <img src={CarIcon} alt="Car Icon" className="inline-block w-4 h-4" />
                  <small className="text-muted px-2 pt-2.5 inline-block">{violation.vehicle_type}</small>
                  <br />
                  <img src={PlateIcon} alt="Plate Icon" className="inline-block w-4 h-4" />
                  <small className="text-muted px-2 pt-2.5 inline-block">{violation.license_plate}</small>
                </p>
              </div>
              <div className="col-auto pr-1">
                <span className="badge bg-warning text-dark">ID: {violation.id}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div><nav aria-label="Page navigation example">
      <ul className="pagination justify-content-end mt-4 pt-2">
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(event, value) => handlePageChange(value)}
          siblingCount={1}
          boundaryCount={1}
          showFirstButton
          showLastButton
          hidePrevButton
          hideNextButton
          shape="rounded"
          sx={{
            '& .MuiPaginationItem-root': {
              color: '#6c757d',
              border: '1px solid #dee2e6',
              backgroundColor: 'transparent',
              padding: '6px 12px',
              borderRadius: '5px',
              '&:hover': {
                zIndex: 2,
                color: '#0056b3',
                textDecoration: 'none',
                backgroundColor: '#e9ecef',
                borderColor: '#dee2e6',
              },
              '&.Mui-selected': {
                zIndex: 1,
                color: '#0056b3',
                backgroundColor: 'transparent',
                borderColor: '#007bff',
              },
              '&.Mui-disabled': {
                color: '#6c757d',
                pointerEvents: 'none',
                cursor: 'auto',
                backgroundColor: 'transparent',
                borderColor: '#dee2e6',
              },
            },
          }}
        />
      </ul>
    </nav></div>
  );
};

export default ViolationList;
