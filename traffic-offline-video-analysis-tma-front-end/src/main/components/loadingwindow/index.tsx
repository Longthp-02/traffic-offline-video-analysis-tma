import React from 'react';
import { FadeLoader } from 'react-spinners';

const LoadingModal: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-inter">
      <div className="relative bg-white p-3 w-1/3 rounded-[16px] shadow-md text-center">
        <button
          className="absolute top-2 right-2 pe-2 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onCancel}
        >
          &times;
        </button>
        <div className="flex flex-col items-center justify-center p-4">
          <FadeLoader height={15} color={'#3b82f6'} loading={true} radius={2} />
          <h1 className="mt-5 text-lg font-bold">Extracting data</h1>
          <p className="mt-3 text-base">Still processing, please wait a moment!</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;

