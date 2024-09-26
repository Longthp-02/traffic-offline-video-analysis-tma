import React, { useState } from 'react';
import backgroundImage from '@/assets/ProcessingPageBackground.png';
import { FaInfoCircle } from "react-icons/fa";
import OptionImage1 from '@/assets/option1.svg?react';
import OptionImage2 from '@/assets/option2.svg?react';
import LoadingModal from '@/main/components/loadingwindow';
import DetectionAreaModal from '@/main/components/uploadVideo';
import UploaderImage from '@/assets/UploaderImage.png';
import { GoToPage } from '@/types/action';
import { Page } from '@/types/type';
import { useAppStore } from '@/main/app/store';
import { saveFileName } from '@/types/action';

const ProcessingPage: React.FC = () => {
  const [selectedViolationOption, setSelectedOption] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [firstRectanglePoints, setFirstRectanglePoints] = useState<{ x: number; y: number }[]>([]);
  const [secondRectanglePoints, setSecondRectanglePoints] = useState<{ x: number; y: number }[]>([]);
  const {dispatcher} = useAppStore()

  const [scaledWidth, setScaledWidth] = useState<number | null>(null);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Track error message

  const goToResultPage = () => dispatcher(new GoToPage(Page.RESULT_PAGE));

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setErrorMessage(null);
  };

  const handleUpload = async (file: File) => {
    if (!selectedViolationOption) {
      setErrorMessage('Please select an option before proceeding.');
      return;
    }
    setVideoFile(file);
    setFileName(file.name);
    extractFirstFrame(file);
  };

  const handleConfirm = async (firstRectanglePoints: { x: number; y: number }[], secondRectanglePoints: { x: number; y: number }[], selectedParkingViolation: string) => {
    setShowModal(false);
    setIsProcessing(true);

    if (!videoFile) {
      console.error("No file selected for processing.");
      return;
    }

    firstRectanglePoints = scalePoints(firstRectanglePoints, scaledWidth, scaledHeight);

    const formData = new FormData();
    formData.append('video', videoFile);
    if (selectedViolationOption === "Parking Violation") {
      formData.append('data', JSON.stringify({
        firstRectanglePoints,
        selectedViolationOption,
        selectedParkingViolation
      }));
    } else {
      secondRectanglePoints = scalePoints(secondRectanglePoints, scaledWidth, scaledHeight);
      formData.append('data', JSON.stringify({
        firstRectanglePoints,
        secondRectanglePoints,
        selectedViolationOption
      }));
    }
    dispatcher(new saveFileName(videoFile.name))

    try {
      // Send the POST request to the server
      const response = await fetch('http://127.0.0.1:8090/process-video', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const result = await response.json();
        if (!result || Object.keys(result).length === 0) {
          console.error('Received an empty response from the server.');
        } else {
          setIsProcessing(false);
          goToResultPage();
          console.log('Video processed successfully:', result);
        }
      } else {
        console.error('Failed to process video. Server responded with:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }

    const formDataVideo = new FormData();
    formDataVideo.append('file', videoFile);

    // Send the POST request to the Minio upload endpoint
    const response = await fetch('http://localhost:3000/upload/video/minio', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
      },
      body: formDataVideo,
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('Response JSON:', responseData);
    } else {
      console.error('Failed to upload video. Server responded with:', response.statusText);
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
  };

  const extractFirstFrame = (videoFile: File) => {
    const video = document.createElement('video');
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameUrl = canvas.toDataURL('image/jpeg');
        setFirstFrameUrl(frameUrl);
        setShowModal(true);
      } else {
        console.error('Unable to get canvas context');
      }
    };

    video.onerror = () => {
      console.error('Error loading video');
    };

    video.src = URL.createObjectURL(videoFile);
  };

  const handleCancelUpload = () => {
    setVideoFile(null);
    setFirstFrameUrl(null);
    setFileName(null);
    setShowModal(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      handleUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      handleUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleScaleDimensions = (width: number, height: number) => {
    setScaledWidth(width);
    setScaledHeight(height);
  };

  const scalePoints = (
    points: { x: number; y: number }[],
    scaleWidth: number | null,
    scaleHeight: number | null
  ): { x: number; y: number }[] => {
    return points.map(point => ({
      x: point.x / (scaleWidth ?? 1), 
      y: point.y / (scaleHeight ?? 1),
    }));
  };

  return (
    <section className="relative h-screen flex items-center justify-center font-inter">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      <div className="relative z-10 flex w-full h-full px-24 pt-28 pb-7 mx-50">
        {/* Left Side */}
        <div className="w-1/3 p-5">
          <h1 className="text-5xl font-bold text-blue-500 mb-5">Video Analysis</h1>
          <p className="my-2 font-medium">
            Enhance road safety and streamline traffic enforcement with our cutting-edge AI technology.
          </p>

          <div className="bg-white opacity-80 p-5 rounded shadow-md hover:-translate-y-0.5">
            <div className="flex items-center mb-3">
              <FaInfoCircle className="text-blue-500 me-2 mb-3" />
              <p className="font-bold text-base">Video requirements</p>
            </div>

            <ul className="list-disc pl-5 mt-2 opacity-100 text-sm ml-5 space-y-3 ">
              <li>Maximum storage is 5MB.</li>
              <li>Video formats with .mp4, .mov.</li>
              <li>Video does not contain loop.</li>
            </ul>
          </div>
        </div>
        {/* Right Side */}
        <div className="h-2/10 w-2/3 px-5 py-4 flex flex-col bg-white rounded shadow-md bg-opacity-70 overflow-y-auto">
          <p className="text-lg font-bold mb-3">Choose violation type</p>
          <div className="flex space-x-5 mb-5 opacity-70">
            <Option
              label="Analyze video footage which was recorded at an intersection with a traffic light."
              isSelected={selectedViolationOption === 'Traffic Light Violation'}
              onClick={() => handleOptionSelect('Traffic Light Violation')}
              ImageComponent={OptionImage1}
              optionName="Traffic signal violation"
            />
            <Option
              label="Analyze video footage which was recorded in areas with no-parking signs."
              isSelected={selectedViolationOption === 'Parking Violation'}
              onClick={() => handleOptionSelect('Parking Violation')}
              ImageComponent={OptionImage2}
              optionName="Unauthorized parking violation"
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
          )}

          <p className="text-lg font-bold mb-3">Upload video</p>
          <div
            className="bg-white p-4 rounded shadow-md flex flex-col items-center font-sans opacity-75"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
        </div>
      </div>
      {isProcessing && <LoadingModal onCancel={handleCancel} />}
      {firstFrameUrl && (
        <DetectionAreaModal
          show={showModal}
          onConfirm={handleConfirm}
          onHide={handleCancelUpload}
          onCancel={handleCancelUpload}
          imageUrl={firstFrameUrl}
          onScaleDimensions={handleScaleDimensions}
          allowSecondBox={selectedViolationOption !== 'Parking Violation'}
        />
      )}
    </section>
  );
};

const Option: React.FC<{
  label: string;
  isSelected: boolean;
  onClick: () => void;
  ImageComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  optionName: string;
}> = ({ label, isSelected, onClick, ImageComponent, optionName }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer h-55 p-4 rounded shadow-md text-center flex-1 hover:-translate-y-3 overflow-auto ${
      isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border-2 border-transparent'
    }`}
  >
    <ImageComponent
      className={`w-20 h-20 mb-2 mt-3 mx-auto ${isSelected ? 'fill-blue-600' : ''}`}
    />
    <p className="text-lg font-semibold">{optionName}</p>
    <div className={`border-t-2 mt-2 pt-2 text-base ${isSelected ? 'border-blue-500' : ''}`}>
      {label}
    </div>
  </div>
);

export default ProcessingPage;
