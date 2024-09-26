import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AnchorLink from 'react-anchor-link-smooth-scroll';

type Props = {
    page: string;
    isInternal?: boolean; // Indicates whether it's an internal link
    onClick?: () => void; // Optional click handler
}

const Link: React.FC<Props> = ({ page, isInternal = false, onClick }) => {
    const lowerCasePage = page.toLowerCase().replace(/ /g, "");

    return isInternal ? (
        <span onClick={onClick} className="text-white cursor-pointer">
            {page}
        </span>
    ) : (
        <AnchorLink className="text-white Inter scroll-smooth" href={`#${lowerCasePage}`}>
            {page}
        </AnchorLink>
    );
};

export default Link;
