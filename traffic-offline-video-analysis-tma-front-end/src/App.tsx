import { useEffect } from 'react';
import HomePage from '@/main/pages/homepage';
import Navbar from './main/components/navbar';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Page } from './types/type';
import ResultPage from './main/pages/result';
import { useAppStore } from './main/app/store';
import ProcessingPage from './main/pages/processing';

const App: React.FC = () => {
  const {
    state: {
      pageState: { currentPage },
    },
  } = useAppStore();

  const navigate = useNavigate();

  useEffect(() => {
    // Only navigate if the current page changes
    if (currentPage === Page.HOMEPAGE) {
      navigate('/');
    } else if (currentPage === Page.RESULT_PAGE) {
      navigate('/result');
    } else if (currentPage === Page.PROCESSING_PAGE) {
      navigate('/processing');
    }
  }, [currentPage, navigate]);

  return (
    <div className='app bg-white'>
      <Navbar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/result' element={<ResultPage />} />
        <Route path='/processing' element={<ProcessingPage />} />
        <Route path='*' element={<HomePage />} /> {/* Redirect unknown routes */}
      </Routes>
    </div>
  );
};

export default App;
