import React, { useState } from 'react';
import UploaderImage from '@/assets/UploaderImage.png';

interface FileUploaderProps {
  onUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileName(file.name);
      onUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      setFileName(file.name);
      onUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevents default to allow dropping
  };

  return (
    <div
      className="bg-white p-4 rounded shadow-md flex flex-col items-center font-sans opacity-75"
      onDragOver={handleDragOver} // Handle drag-over event
      onDrop={handleDrop} // Handle drop event
    >
      <img
        src={UploaderImage}
        alt="Upload"
        className="bg-blue-100 h-20 rounded-full mb-3 shadow-md object-scale-down"
      />
      <p className="font-medium mb-2">Drag your file here or</p>
      <label className="relative w-52 cursor-pointer bg-blue-600 text-white rounded-lg py-2 px-4 inline-flex justify-center hover:scale-105">
        <span>Browse</span>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="video/*"
          onChange={handleFileChange}
        />
      </label>
      {fileName && <p className="mt-2 text-sm text-gray-500">{fileName}</p>}
    </div>
  );
};

export default React.memo(FileUploader);

