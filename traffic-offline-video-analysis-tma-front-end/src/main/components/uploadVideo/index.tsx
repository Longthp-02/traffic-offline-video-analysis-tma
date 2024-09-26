import React, { useState, useRef, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface DetectionAreaModalProps {
  show: boolean;
  onConfirm: (firstPoints: { x: number; y: number }[], secondPoints: { x: number; y: number }[], selectedParkingViolation: string) => void;
  onHide: () => void;
  onCancel: () => void;
  imageUrl: string;
  onScaleDimensions: (width: number, height: number) => void;
  allowSecondBox: boolean; 
}

const DetectionAreaModal: React.FC<DetectionAreaModalProps> = ({ 
  show, 
  onConfirm, 
  onHide, 
  onCancel, 
  imageUrl, 
  onScaleDimensions,
  allowSecondBox
}) => {
  const [firstRectanglePoints, setFirstRectanglePoints] = useState<{ x: number; y: number }[]>([]);
  const [secondRectanglePoints, setSecondRectanglePoints] = useState<{ x: number; y: number }[]>([]);
  const [currentRectangle, setCurrentRectangle] = useState<'first' | 'second'>('first');
  const [isDisable, setIsDisable] = useState(false);
  const [isFirstRectangleComplete, setIsFirstRectangleComplete] = useState(false);
  const [isSecondRectangleComplete, setIsSecondRectangleComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [selectedParkingViolation, setSelectedParkingViolation] = useState<'parking' | 'stop'>('parking'); 

  // Set fixed dimensions for the canvas
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 600;

  useEffect(() => {
    if (show) {
      setFirstRectanglePoints([]);
      setSecondRectanglePoints([]);
      setIsFirstRectangleComplete(false);
      setIsSecondRectangleComplete(false);
      setCurrentRectangle('first');
    }
  }, [show]);

  useEffect(() => {
    drawPoints();
  }, [firstRectanglePoints, secondRectanglePoints, currentRectangle, isFirstRectangleComplete, isSecondRectangleComplete]);

  const handleImageClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log('x:', x, 'y:', y);

    const scaledX = (x / canvas.clientWidth) * canvas.width;
    const scaledY = (y / canvas.clientHeight) * canvas.height;

    if (currentRectangle === 'first') {
      if (isFirstRectangleComplete) {
        // If the first rectangle is already complete, do not accept any more clicks
        return;
      }
      const newPoints = [...firstRectanglePoints, { x: scaledX, y: scaledY }];
      setFirstRectanglePoints(newPoints);
      const firstPoint = firstRectanglePoints[0];
      if (firstPoint) {
        const dx = scaledX - firstPoint.x;
        const dy = scaledY - firstPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = 40; // Adjust based on desired sensitivity
        if (newPoints.length === 10 || distance <= threshold) {
        //remove the last point
        setFirstRectanglePoints(prevArray => prevArray.filter((_, index) => index !== prevArray.length - 1));
        setIsDisable(true);
        setIsFirstRectangleComplete(true);
      }
      }
      

    } else if (allowSecondBox && currentRectangle === 'second') {
      if (isSecondRectangleComplete) {
        // If the second rectangle is already complete, do not accept any more clicks
        return;
      }
      const newPoints = [...secondRectanglePoints, { x: scaledX, y: scaledY }];
      setSecondRectanglePoints(newPoints);
      const firstPoint = secondRectanglePoints[0];
      if (firstPoint) {
        const dx = scaledX - firstPoint.x;
        const dy = scaledY - firstPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = 40; // Adjust based on desired sensitivity
        if (newPoints.length === 10 || distance < threshold) {
        //remove the last point
        setSecondRectanglePoints(prevArray => prevArray.filter((_, index) => index !== prevArray.length - 1));
        setIsDisable(true);
        setIsSecondRectangleComplete(true);
      }
      }
      
    }
  };

  const drawPoints = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;
  
    if (!canvas || !ctx || !image) return;
  
    // Calculate scaled dimensions
    const scaleFactor = Math.min(1, MAX_WIDTH / image.naturalWidth, MAX_HEIGHT / image.naturalHeight);
    const scaledWidth = image.naturalWidth * scaleFactor;
    const scaledHeight = image.naturalHeight * scaleFactor;

    onScaleDimensions(scaledWidth, scaledHeight);
  
    // Set canvas size to scaled dimensions
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
  
    ctx.clearRect(0, 0, scaledWidth, scaledHeight);
  
    // Draw the image centered and scaled
    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
  
    // Draw the first rectangle
    if (firstRectanglePoints.length > 0) {
      firstRectanglePoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
  
      if (isFirstRectangleComplete) {
        drawRectangle(ctx, firstRectanglePoints, 'red');
      }
    }
  
    // Draw the second rectangle
    if (allowSecondBox && secondRectanglePoints.length > 0) {
      secondRectanglePoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });
  
      if (isSecondRectangleComplete) {
        drawRectangle(ctx, secondRectanglePoints, 'blue');
      }
    }
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], color: string) => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = color === 'red' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)';
    ctx.fill();
  };

  const handleReset = () => {
    setFirstRectanglePoints([]);
    setSecondRectanglePoints([]);
    setCurrentRectangle('first');
    setIsFirstRectangleComplete(false);
    setIsSecondRectangleComplete(false);
  };

  const handleConfirm = () => {
    if (isFirstRectangleComplete) {
      console.log('First rectangle points:', firstRectanglePoints);
      if (!allowSecondBox || isSecondRectangleComplete) {
        onConfirm(firstRectanglePoints, secondRectanglePoints, selectedParkingViolation);
      } else {
        alert("Please complete the second rectangle.");
      }
    } else {
      alert("Please complete at least the first rectangle before confirming.");
    }
  };

  const handleNext = () => {
    if (isFirstRectangleComplete) {
      if (allowSecondBox) {
        setIsDisable(false);
        setCurrentRectangle('second');
        // Clear the canvas for the second rectangle
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Redraw the image
          const image = imageRef.current;
          if (image) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          }
        }
      } else {
        handleConfirm(); // Automatically confirm if second box is not allowed
      }
    }
  };

  const handleCancel = () => {
    onCancel();
    onHide();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75 font-inter">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex px-5 text-2xl justify-between items-center border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Detection Area Selection</h3>
          <button onClick={onHide} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="p-4">
          <div className="border border-l-8 border-blue-600 bg-blue-50 text-sm rounded flex items-center mb-4 p-3">
            {/* <FaInfoCircle className="text-blue-500 mr-2" />
            <p>Please select points for AI Detection. You can select up to 10 points. If you want to select less than 10 points, please re-click on the first point</p> */}
            <div className="flex items-center mb-3">
              <FaInfoCircle className="text-blue-500 me-2 mb-3" />
              <p className="font-bold text-base">Instructions</p>
            </div>
            <ul className="list-disc pl-5 mt-2 opacity-100 text-sm ml-5 space-y-3 ">
              <li>Please select points for AI Detection.</li>
              <li>You can select up to 10 points.</li>
              <li>If you want to select less than 10 points, please re-click on the first point.</li>
            </ul>
          </div>
          <div className="relative">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="First frame"
              className="hidden"
              onLoad={() => {
                if (canvasRef.current && imageRef.current) {
                  drawPoints();
                }
              }}
            />
            <canvas
              ref={canvasRef}
              onClick={handleImageClick}
              style={{
                cursor: (isFirstRectangleComplete && (!allowSecondBox || isSecondRectangleComplete)) ? 'default' : 'crosshair',
                width: '100%',
                height: 'auto',
              }}
            />
          </div>
          {!allowSecondBox && (
            <div>
              <label className="mr-4 mt-2">
                <input
                  type="radio"
                  name="violation"
                  value="parking"
                  checked={selectedParkingViolation === 'parking'}
                  onChange={() => setSelectedParkingViolation('parking')}
                  className="mr-2" // Adds space between the radio button and text
                />
                No-Parking
              </label>
              <label>
                <input
                  type="radio"
                  name="violation"
                  value="stop"
                  checked={selectedParkingViolation === 'stop'}
                  onChange={() => setSelectedParkingViolation('stop')}
                  className="mr-2" // Adds space between the radio button and text
                />
                No-Stop
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center p-5 border-t border-gray-200">
          <button 
            className="text-blue-600 text-sm py-2 px-4 rounded-lg hover:bg-gray-100"
            onClick={handleCancel}>
            Cancel
          </button>
          <div>
            <button 
              className="border border-blue-600 text-blue-600 bg-white text-sm py-2 px-4 rounded-lg hover:bg-gray-100"
              onClick={handleReset}>
              Reset detection area
            </button>
            <button
              className={`ml-3 py-2 px-4 w-36 rounded-lg text-sm ${
                isDisable
                  ? 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={currentRectangle === 'second' ? handleConfirm : handleNext}
              disabled={!isDisable}>
              {allowSecondBox && currentRectangle === 'second' ? "Confirm" : "Next"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetectionAreaModal;
