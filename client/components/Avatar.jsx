import React from 'react';
import PropTypes from 'prop-types';

import './components.less';

const avatarFallback = 'https://scontent.ftun4-1.fna.fbcdn.net/v/t1.15752-9/60527675_1174995906011491_1169406813154574336_n.jpg?_nc_cat=105&_nc_ht=scontent.ftun4-1.fna&oh=bf0b02ae9e1c92a02f405265f7858648&oe=5D67DC03';
const failTimes = new Map();

function handleError(e) {
    const times = failTimes.get(e.target) || 0;
    if (times >= 2) {
        return;
    }
    e.target.src = avatarFallback;
    failTimes.set(e.target, times + 1);
}

const Avatar = ({ src, size = 60, className = '', ...props }) => (
    <img
        className={`component-avatar ${className}`}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        src={/(blob|data):/.test(src) ? src : `${src}?imageView2/3/w/${size * 2}/h/${size * 2}`}
        onError={handleError}
        {...props}
    />
);
Avatar.propTypes = {
    src: PropTypes.string.isRequired,
    size: PropTypes.number,
    className: PropTypes.string,
    onClick: PropTypes.func,
};

export default Avatar;
