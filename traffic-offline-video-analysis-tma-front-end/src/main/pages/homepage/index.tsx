
import styled from 'styled-components';
import backgroundImage from '@/assets//HomePageBackground.png';
import { motion } from 'framer-motion';
import Illustrator from '@/assets//Illustration.png';
import { GoToPage } from '@/types/action';
import { Page } from '@/types/type';
import { useAppStore } from '@/main/app/store';

const HomePage: React.FC = () => {
  const {dispatcher} = useAppStore()

  const goToProcessingPage = () => dispatcher(new GoToPage(Page.PROCESSING_PAGE));

  return <section
    id="home" 
    className=' gap-16 py-10 md:h-full md:pb-0 bg-auto bg-center'
    style={{ backgroundImage: `url(${backgroundImage})`}}
  >
    {/* Image and Main Header */}
    <div className='md:flex mx-auto w-5/6 items-center justify-center md:h-5/6'>
      {/* Main Header */}
      <div className='z-10 mt-32 md:basis-3/5 =>'>
        {/* Heading */}
        <motion.div 
          className='md:-mt-20'
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.5}}
          transition={{duration: 0.5}}
          variants={{
            hidden: {opacity: 0, x: -50},
            visible: { opacity: 1, x: 0}
          }}
        >
          <div className='relative'>
            <div className='before:absolute before:-top-20'>
            <Title>Leverage <Highlight>AI-powered recognition</Highlight> for smart security and traffic management</Title>
            </div>
          </div>
          <Subtitle>Analyze existing footage to extract data from offline cameras then unlock insights for investigations, traffic analysis, and historical review</Subtitle>
        </motion.div>
          {/* Action Button */}
          <motion.div 
            className='mt-8 flex items-center gap-8 md:justify-start'
            initial="hidden"
            whileInView="visible"
            viewport={{once: true, amount: 0.5}}
            transition={{delay: 0.2, duration: 0.5}}
            variants={{
              hidden: {opacity: 0, x: -50},
              visible: { opacity: 1, x: 0}
            }}
          >
            <Button onClick={goToProcessingPage}>Get started</Button>
            <Button primary>Contact us</Button>
          </motion.div>
        <div>

        </div>
      </div>

      {/* Illustration */}
      <div className='flex basis-3/5 justify-center md:z-10
            md:ml-40 md:mt-16 md:justify-items-end'>
        <img src={Illustrator} alt="home-pageGraphic" />
      </div>
    </div>
  </section>
};

export default HomePage;

// Styled components definition remains the same
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #2a7ef9;
  color: #fff;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  // padding: 20px 0;
  // background: blue-200;
`;

const Content = styled.div<{ backgroundImage: string }>`
  width: 100vw;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  backgroundRepeat: 'no-repeat',
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 2.5em;
  font-family: 'Nunito', sans-serif;
  font-weight: 550;
  margin-bottom: 20px;
  color: white;
`;

const Highlight = styled.span`
  color: #F1AB23;
`;

const Subtitle = styled.p`
  font-size: 0.8em;
  font-family: 'Inter', sans-serif;
  margin-bottom: 40px;
  color: white;
  margin-top: 20px;
  text-align: start;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
`;

const Button = styled.button<{ primary?: boolean }>`
  background: ${props => (props.primary ? '#2A7EF9' : '#fff')};
  color: ${props => (props.primary ? '#fff' : '#2A7EF9')};
  border: 1px solid #fff;
  padding: 5px 50px;
  cursor: pointer;
  font-size: 1em;
  border-radius: 5px;
  font-family: 'Inter', sans-serif;
`;


