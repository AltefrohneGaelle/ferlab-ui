import React from 'react';
import { BarDatum, BarSvgProps, ResponsiveBar } from '@nivo/bar';
import { Typography } from 'antd';

import styles from './index.module.scss';

type TBarChart = Omit<BarSvgProps<BarDatum>, 'width' | 'height'> & {
    title?: string;
};

const { Title } = Typography;

const BarChart = ({
    margin = { bottom: 12, left: 24, right: 24, top: 12 },
    onMouseEnter,
    colorBy = 'indexValue',
    title,
    ...rest
}: TBarChart): JSX.Element => (
    <div className={styles.barChartWrapper}>
        <div className={styles.barChartContent}>
            {title && (
                <Title className={styles.title} level={5}>
                    {title}
                </Title>
            )}
            <ResponsiveBar
                colorBy={colorBy}
                margin={margin}
                onMouseEnter={(_: any, e: any) => {
                    if (onMouseEnter) {
                        onMouseEnter(_, e);
                    }
                    e.target.style.cursor = 'pointer';
                }}
                {...rest}
            />
        </div>
    </div>
);

export default BarChart;
