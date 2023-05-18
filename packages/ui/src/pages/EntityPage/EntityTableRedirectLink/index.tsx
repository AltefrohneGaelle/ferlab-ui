import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Space } from 'antd';

import styles from './index.module.scss';

type TEntityTableRedirectLink = {
    to: string;
    onClick?: () => void;
    children: ReactNode;
    icon?: ReactNode;
};

const EntityTableRedirectLink = (props: TEntityTableRedirectLink): JSX.Element => (
    <Link className={styles.link} {...props}>
        <Space size={4}>
            <span className={styles.content}>{props.children}</span>
            <span className={styles.icon}>{props.icon}</span>
        </Space>
    </Link>
);

export default EntityTableRedirectLink;