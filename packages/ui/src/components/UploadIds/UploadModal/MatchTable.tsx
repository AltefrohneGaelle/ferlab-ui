import React from 'react';
import { Table } from 'antd';
import { get } from 'lodash';
import Empty from '../../Empty';
import { MatchTableItem, UploadIdDictionary } from '../types';

import styles from '@ferlab/style/components/uploadids/UploadIdsModal.module.scss';

interface OwnProps {
    matchItems: MatchTableItem[];
    loading?: boolean;
    dictionary: UploadIdDictionary;
}

const MatchTable = ({ matchItems, loading = false, dictionary }: OwnProps) => (
    <Table
        bordered
        size="small"
        className={styles.resultsTable}
        dataSource={matchItems}
        pagination={{
            pageSize: 5,
            hideOnSinglePage: true,
            className: styles.tablePagination,
        }}
        loading={loading}
        locale={{
            emptyText: <Empty showImage={false} description={get(dictionary, 'emptyTableDescription', 'No data')} />,
        }}
        columns={[
            {
                title: dictionary.submittedColTitle,
                align: 'center',
                className: styles.tableCell,
                children: [
                    {
                        title: dictionary.matchTable.idColTitle,
                        dataIndex: 'submittedId',
                    },
                ],
            },
            {
                title: get(dictionary, 'mappedTo', 'Mapped To'),
                align: 'center',
                children: [
                    {
                        title: dictionary.matchTable.matchFieldColTitle,
                        dataIndex: 'matchField',
                    },
                    {
                        title: dictionary.matchTable.mappedToFieldColTitle,
                        dataIndex: 'mappedTo',
                    },
                ],
            },
        ]}
    />
);

export default MatchTable;
