import React, { useState } from 'react';
import CountryFlag from 'react-country-flag';
import { SlArrowDown } from "react-icons/sl";
import { SlArrowUp } from "react-icons/sl";

const DropdownLanguageSelector: React.FC = () => {
  const [countries] = useState([
    { title: 'United Kingdom', code: 'GB' },
    { title: 'United States', code: 'US' },
    { title: 'Viet Nam', code: 'VN' },
  ]);
  
  const [toggleContents, setToggleContents] = useState(
    <>
        <CountryFlag 
            countryCode={'VN'} 
            svg
            style={{
                width: '2em',
                height: '2em',
            }}
        />
    </>
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>('VN'); // Set the default selected country to VN
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <button 
        className='p-3 w-23 h-10 flex items-center justify-between border-2 border-white active:border-white duration-300 rounded-lg'
        onClick = {() => setIsOpen((prev) => !prev)}
        >
    
        {toggleContents}
        {!isOpen ? (
            <SlArrowDown className="fill-white w-9 h-10 pl-4"></SlArrowDown>
        ) : (
            <SlArrowUp className="fill-white w-9 h-10 pl-4" ></SlArrowUp>
        )}
        </button>

        {isOpen && (
            <div className='bg-white absolute top-14 flex flex-col items-start rounded-lg p-2'>
                {countries.map(({ code, title }) => (
                    <div 
                        className='flex w-full justify-between hover:bg-gray-400 cursor-pointer rounded-lg border-l-transparent hover:border-l-4 p-1'
                        onClick={() => {
                            setSelectedCountry(code);
                            // Update toggleContents to reflect the newly selected country
                            setToggleContents(
                              <>
                                <CountryFlag 
                                      countryCode={code}
                                      svg
                                      style={{
                                          width: '2em',
                                          height: '2em',
                                      }} 
                                  /> 
                              </>
                            );
                          }}
                    >    
                        <CountryFlag
                        countryCode={code}
                        svg
                        style={{
                            width: '2em',
                            height: '2em',
                        }}
                        className="mr-2" 
                    /> 
                        <h3 className='text-[10px] semi-bold'>{title}</h3>
                    </div>
                ))}
            </div>)}
    </div>
  );
};

export default DropdownLanguageSelector;
