import React from 'react';
import { IIconProps } from './type';

const CheckedIcon = ({ className = '', width = '16', height = '16' }: IIconProps) => (
    <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 24 23"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M16.3819 8.27356H15.2827C15.0436 8.27356 14.8163 8.3884 14.6757 8.58528L10.9913 13.6947L9.32252 11.379C9.18189 11.1845 8.95689 11.0673 8.71549 11.0673H7.61626C7.46392 11.0673 7.37486 11.2407 7.46392 11.365L10.3842 15.415C10.4532 15.5113 10.5442 15.5897 10.6495 15.6438C10.7549 15.698 10.8717 15.7262 10.9901 15.7262C11.1086 15.7262 11.2253 15.698 11.3307 15.6438C11.436 15.5897 11.527 15.5113 11.596 15.415L16.5319 8.57122C16.6233 8.447 16.5343 8.27356 16.3819 8.27356Z" />
        <path d="M12 1.50012C6.20156 1.50012 1.5 6.20168 1.5 12.0001C1.5 17.7986 6.20156 22.5001 12 22.5001C17.7984 22.5001 22.5 17.7986 22.5 12.0001C22.5 6.20168 17.7984 1.50012 12 1.50012ZM12 20.7189C7.18594 20.7189 3.28125 16.8142 3.28125 12.0001C3.28125 7.18606 7.18594 3.28137 12 3.28137C16.8141 3.28137 20.7188 7.18606 20.7188 12.0001C20.7188 16.8142 16.8141 20.7189 12 20.7189Z" />
    </svg>
);
export default CheckedIcon;
