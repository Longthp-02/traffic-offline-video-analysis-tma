import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Result, VehicleType } from '@/main/model/result';
import ViolationList from '@/main/components/result/violationList';
import { useAppStore } from '@/main/app/store';


const ResultPage: React.FC = () => {
  const [violations, setViolations] = useState<Result[]>([]);
  const [filters, setFilters] = useState({
    Car: true,
    Motorbike: true
  });
  const [videoUrl, setVideoUrl] = useState<string>();

  const {
    state: {
      fileState: { currentFileName },
    },
  } = useAppStore()

  useEffect(() => {
    // Fetch data inside useEffect
    const fetchData = async () => {
      try {
        console.log("Check current file name")
        console.log(currentFileName)
        const url = 'http://0.0.0.0:3000/find-by-video-name/?video_name=' + currentFileName;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Ensure the data contains matching_files and it is an array
          if (data?.matching_files && Array.isArray(data.matching_files)) {
            const formattedData = data.matching_files
              .filter((item: any) => item.image_type === 'vehicle')
              .map((item: any) => {
                // Find the plate URL for the current item based on the same ID and image_type as 'plate'
                const plateItem = data.matching_files.find((i: any) => i.id === item.id && i.image_type === 'plate');
                const plate_url = plateItem ? plateItem.url : '';
        
                return {
                    id: item.id,
                    image_type: item.image_type,
                    license_plate: item.license_plate,
                    fileName: item.object_name,
                    timestamp: item.timestamp,
                    url: item.url,
                    plate_url: plate_url,
                    vehicle_type: item.vehicle_type === 'car' ? VehicleType.Car : VehicleType.Motorbike,
                };
            });

            setViolations(formattedData as Result[]);
          } else {
            console.error('Data is not in the expected format:', data);
            setViolations([]); // Set to empty array if the data is not in the expected format
          }

        } else {
          console.error('Failed to fetch. Server responded with:', response.statusText);
        }

        // Fetch the video URL
        const url1 = 'http://0.0.0.0:3000/find-video-url-by-video-name/?video_name=' + currentFileName;
        const responseVideoUrl = await fetch(url1, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (responseVideoUrl.ok) {
          const videoData = await responseVideoUrl.json();
          
          if (videoData?.matching_files && Array.isArray(videoData.matching_files)) {
            const formattedData = videoData.matching_files
            setVideoUrl(formattedData[0].url);
          }
        } else {
          console.error('Failed to fetch video URL. Server responded with:', responseVideoUrl.statusText);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      
    };

    fetchData(); // Call the fetch function

  }, []);

  const handleFilterChange = (type: 'Car' | 'Motorbike') => {
    setFilters(prevFilters => {
      if (prevFilters[type] && (filters.Car !== filters.Motorbike)) {
        return {
          Car: prevFilters[type],
          Motorbike: prevFilters[type]
        };
      } else {
        // Otherwise, select the new filter and unselect the other
        return {
          Car: type === 'Car',
          Motorbike: type === 'Motorbike'
        };
      }
    });
  };

  const filteredViolations = violations.filter(v => filters[v.vehicle_type]);

  console.log("Video URL: ", videoUrl);

  return (
    <div className="container-fluid bg-light pt-20 px-5 overflow-hidden">  
      <div className="row row-custom bg-white p-3 rounded-xl">
        <div className="col-md-8">
          <h5 className="mb-3">Video uploaded</h5>
          <div className="mb-3" style={{ minHeight: '540px', position: 'relative'}}>
            {videoUrl ? (
              <video
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '0.5em' }}
                controls
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <p>Loading video...</p>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className='mt-2'>Violation(s): {violations.length}</h5>
            <span className='h-2.5 w-2.5 bg-gray-400 rounded-full inline-block'></span>
            <div className='d-flex'>
            <div className="mr-2">Filter by vehicle:</div>
            <div className="">         
              <button type="button" className={`btn btn-outline-primary btn-sm py-0 mr-2 rounded-pill ${(!filters.Car && filters.Motorbike) || (filters.Motorbike && filters.Car) ? '' : 'active'}`} 
                onClick={() => handleFilterChange('Car')}>
                  Car
              </button>
              <button className={`btn btn-outline-primary btn-sm py-0 rounded-pill ${(!filters.Motorbike && filters.Car) || (filters.Motorbike && filters.Car) ? '' : 'active'}`} 
                onClick={() => handleFilterChange('Motorbike')}>
                  Motorbike              
              </button>            
            </div>
          </div>
            </div>
            <ViolationList violations={filteredViolations} />
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
