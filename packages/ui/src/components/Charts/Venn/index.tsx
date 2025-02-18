import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ExperimentOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    UserOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Checkbox, Divider, Form, Input, Modal, Select, Space, Table, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import classnames from 'classnames';
import * as d3 from 'd3';
import { v4 } from 'uuid';

import { ISyntheticSqon } from '../../../data/sqon/types';
import { IUserSetOutput } from '../../BiospecimenRequest/requestBiospecimen.utils';
import ExternalLinkIcon from '../../ExternalLink/ExternalLinkIcon';

import VennQueryPill from './VennQueryPill';
import VennSekeleton from './VennSekeleton';

import styles from './index.module.css';

const FORM_NAME = 'save-set';
const SET_NAME_KEY = 'nameSet';
const PERSISTENT_KEY = 'persistent';

enum Index {
    participant = 'participant',
    biospecimen = 'biospecimen',
    file = 'file',
}

const PADDING_OFFSET = 24;
const MAX_TITLE_LENGTH = 200;
const LABELS = ['Q₁', 'Q₂', 'Q₃'];

export const DEFAULT_VENN_CHART_DICTIONARY: TVennChartDictionary = {
    biospecimens: 'Biospecimens',
    count: 'Count :',
    files: 'Files',
    participants: 'Participants',
    query: {
        column: 'Query definition',
        title: 'Selected queries',
    },
    save: {
        alreadyExist: 'A set with this name already exists',
        cancel: 'Cancel',
        checkbox: {
            label: 'Save this set for future reference',
            tooltips:
                'A saved set is a collection of one or more entity IDs which can be saved and revisited for later use.',
        },
        label: 'Set name',
        maximumLength: `${MAX_TITLE_LENGTH}characters maximum`,
        ok: 'View set',
        permittedCharacters: 'Permitted characters: A-Z a-z 0-9 ()[]-_:|.,',
        placeholder: (entity: string) => `My ${entity} set`,
        requiredField: 'This field is required',
        selected: (count: number) => `You have selected ${count} entities.`,
        title: 'View in Data Exploration',
    },
    set: {
        column: 'Set definition',
        footer: 'Union of selected sets',
        title: 'Set definitions',
        tooltips: 'View in exploration',
    },
};

export interface ISummaryData {
    operation: string;
    entityCount: number;
    qbSqon: ISyntheticSqon;
}

export interface ISetOperation {
    operation: string;
    entityCount: number;
    entitySqon: ISyntheticSqon;
    setId: string;
}

export type TVennChartDictionary = {
    query: {
        title: string;
        column: string;
    };
    set: {
        title: string;
        column: string;
        footer: string;
        tooltips: string;
    };
    save: {
        placeholder: (entity: string) => string;
        maximumLength: string;
        permittedCharacters: string;
        requiredField: string;
        title: string;
        selected: (count: number) => string;
        label: string;
        checkbox: {
            label: string;
            tooltips: string;
        };
        alreadyExist: string;
        ok: string;
        cancel: string;
    };
    count: string;
    participants: string;
    biospecimens: string;
    files: string;
};

type THandleSubmit = {
    index: string;
    name: string;
    sets: ISetOperation[];
    persistent: boolean;
    callback: () => void;
};

export type TVennChart = {
    savedSets: IUserSetOutput[];
    dictionary?: TVennChartDictionary;
    loading?: boolean;
    handleIndexChange: (qbSqons: ISyntheticSqon[], index: string) => void;
    handleClose: () => void;
    handleSubmit: (props: THandleSubmit) => void;
    outlineWidth?: number;
    radius?: number;
    factor?: number;
    summary?: ISummaryData[];
    operations?: ISetOperation[];
};

const getIcon = (mode: Index) => {
    switch (mode) {
        case Index.participant:
            return <UserOutlined />;
        case Index.biospecimen:
            return <ExperimentOutlined />;
        case Index.file:
            return <FileTextOutlined />;
    }
};

const getSummaryColumns = (mode: Index, dictionary: TVennChartDictionary): ColumnsType<ISummaryData> => [
    {
        dataIndex: 'operation',
        key: 'operation',
    },
    {
        dataIndex: 'qbSqon',
        key: 'qbSqon',
        render: (qbSqon) => <VennQueryPill sqon={qbSqon} />,
        title: dictionary.query.column,
    },
    {
        align: 'right',
        dataIndex: 'entityCount',
        key: 'entityCount',
        title: getIcon(mode),
        width: 100,
    },
];

const getOperationColumns = ({
    dictionary,
    mode,
    onClick,
}: {
    mode: Index;
    onClick: (record: ISetOperation) => void;
    dictionary: TVennChartDictionary;
}): ColumnsType<ISetOperation> => [
    {
        dataIndex: 'operation',
        key: 'operation',
        title: dictionary.set.column,
    },
    {
        align: 'right',
        dataIndex: 'entityCount',
        key: 'entityCount',
        title: getIcon(mode),
        width: 100,
    },
    {
        key: 'open',
        render: (record) => (
            <Tooltip title={dictionary.set.tooltips}>
                <Button
                    className={styles.button}
                    disabled={record.entityCount === 0}
                    icon={<ExternalLinkIcon />}
                    onClick={() => onClick(record)}
                    type="link"
                />
            </Tooltip>
        ),
        width: 32,
    },
];

/**
 * @TODO Add OR operator when combine operation set
 * @TODO Check query builder, select two query, add same logic here
 */
const VennChart = ({
    dictionary = DEFAULT_VENN_CHART_DICTIONARY,
    factor = 0.75,
    handleClose,
    handleIndexChange,
    handleSubmit,
    loading,
    operations = [],
    outlineWidth = 1.5,
    radius = 130,
    savedSets,
    summary = [],
}: TVennChart): JSX.Element => {
    const [form] = Form.useForm();
    const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [index, setIndex] = useState<Index>(Index.participant);
    const [tableSelectedSets, setTableSelectedSets] = useState<ISetOperation[]>([]);
    const [selectedSets, setSelectedSets] = useState<ISetOperation[]>([]);
    const total = useCallback(() => {
        let sum = 0;
        tableSelectedSets.forEach((set) => {
            sum += set.entityCount;
        });
        return sum;
    }, [tableSelectedSets]);
    const ref = useRef<HTMLDivElement>(null);
    const chartId = `venn-chart-${v4()}`;

    useEffect(() => {
        if (!ref?.current) return;
        if (loading) return;

        const circle1 = `circle1-${v4()}`;
        const circle1out = `circle1_out-${v4()}`;
        const circle2 = `circle2-${v4()}`;
        const circle2out = `circle2_out-${v4()}`;

        const { height, width } = ref.current.getBoundingClientRect();
        const cy = (1.0 / summary.length) * height + PADDING_OFFSET;
        const cx = 0.48 * width;
        const svg = d3.select(`#${chartId}`);
        const defs = svg.append('svg:defs');

        /**
         * Circle1 'Q₁' is placed at the top left
         */
        defs.append('svg:clipPath')
            .attr('id', circle1)
            .append('svg:circle')
            .attr('cx', cx + Math.sin((Math.PI * 300) / 180) * radius * factor)
            .attr('cy', cy - Math.cos((Math.PI * 300) / 180) * radius * factor)
            .attr('r', radius);
        defs.append('svg:clipPath')
            .attr('id', circle1out)
            .append('svg:circle')
            .attr('cx', cx + Math.sin((Math.PI * 300) / 180) * radius * factor)
            .attr('cy', cy - Math.cos((Math.PI * 300) / 180) * radius * factor)
            .attr('r', radius + outlineWidth);
        svg.append('svg:rect')
            .attr('clip-path', `url(#${circle1out})`)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', styles.outline);
        svg.append('svg:rect')
            .attr('id', operations[0].setId)
            .attr('clip-path', `url(#${circle1})`)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[0].entityCount === 0 }));
        // Insert 'Q₁' text to the left of Circle1
        svg.append('text')
            .attr('x', cx + Math.sin((Math.PI * 300) / 180) * 2.5 * radius * factor)
            .attr('y', cy - Math.cos((Math.PI * 300) / 180) * 2.5 * radius * factor)
            .attr('text-anchor', 'end')
            .attr('class', styles.legend)
            .text(LABELS[0]);
        // Insert count of (Q₁)-(Q₂∩Q₃)
        svg.append('text')
            .attr('x', cx + Math.sin((Math.PI * 300) / 180) * 1.1 * radius * factor)
            .attr('y', cy - Math.cos((Math.PI * 300) / 180) * 1.0 * radius * factor)
            .attr('text-anchor', 'end')
            .attr('class', classnames(styles.legend, { [styles.disabled]: operations[0].entityCount === 0 }))
            .text(operations[0].entityCount);

        /**
         * Circle2 'Q₂' is placed at the top left
         */
        defs.append('svg:clipPath')
            .attr('id', circle2)
            .append('svg:circle')
            .attr('cx', cx + Math.sin((Math.PI * 60) / 180) * radius * factor)
            .attr('cy', cy - Math.cos((Math.PI * 60) / 180) * radius * factor)
            .attr('r', radius);
        defs.append('svg:clipPath')
            .attr('id', circle2out)
            .append('svg:circle')
            .attr('cx', cx + Math.sin((Math.PI * 60) / 180) * radius * factor)
            .attr('cy', cy - Math.cos((Math.PI * 60) / 180) * radius * factor)
            .attr('r', radius + outlineWidth);
        svg.append('svg:rect')
            .attr('clip-path', `url(#${circle2out})`)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', styles.outline);
        svg.append('svg:rect')
            .attr('id', operations[1].setId)
            .attr('clip-path', `url(#${circle2})`)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[1].entityCount === 0 }));
        // Insert 'Q₂' text to the right of Circle2
        svg.append('text')
            .attr('x', cx + Math.sin((Math.PI * 60) / 180) * 2.5 * radius * factor)
            .attr('y', cy - Math.cos((Math.PI * 60) / 180) * 2.5 * radius * factor)
            .attr('text-anchor', 'start')
            .attr('class', styles.legend)
            .text(LABELS[1]);
        // Insert count value of (Q₂)-(Q₁∩Q₃)
        svg.append('text')
            .attr('x', cx + Math.sin((Math.PI * 60) / 180) * 1.1 * radius * factor)
            .attr('y', cy - Math.cos((Math.PI * 60) / 180) * 1.0 * radius * factor)
            .attr('text-anchor', 'start')
            .attr('class', classnames(styles.legend, { [styles.disabled]: operations[1].entityCount === 0 }))
            .text(operations[1].entityCount);

        /**
         * Intersection 'Q₁∩Q₂' between Circle1 and Circle2
         */
        svg.append('svg:g')
            .attr('clip-path', `url(#${circle1out})`)
            .append('svg:rect')
            .attr('clip-path', `url(#${circle2out})`)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', styles.outline);

        /**
         * When only having two sets, when add the intersection of (Q₁∩Q₂)
         */
        if (summary.length == 2) {
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle1})`)
                .append('svg:rect')
                .attr('id', operations[2].setId)
                .attr('clip-path', `url(#${circle2})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[2].entityCount === 0 }));
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 360) / 180) * 0.85 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 360) / 180) * 0.5 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[2].entityCount === 0 }))
                .text(operations[2].entityCount);
        }

        /**
         * Add a third set to the operations, (Q₁∩Q₂) is now (Q₁∩Q₂)-Q₃
         */
        if (summary.length == 3) {
            // Insert count value of (Q₁∩Q₂)-Q₃
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle1})`)
                .append('svg:rect')
                .attr('id', operations[3].setId)
                .attr('clip-path', `url(#${circle2})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[3].entityCount === 0 }));

            /**
             * Circle3 'Q₃' is placed at the bottom middle position
             */
            const circle3 = `circle3-${v4()}`;
            const circle3out = `circle3_out-${v4()}`;

            defs.append('svg:clipPath')
                .attr('id', circle3)
                .append('svg:circle')
                .attr('cx', cx + Math.sin((Math.PI * 180) / 180) * radius * factor)
                .attr('cy', cy - Math.cos((Math.PI * 180) / 180) * radius * factor)
                .attr('r', radius);
            defs.append('svg:clipPath')
                .attr('id', circle3out)
                .append('svg:circle')
                .attr('cx', cx + Math.sin((Math.PI * 180) / 180) * radius * factor)
                .attr('cy', cy - Math.cos((Math.PI * 180) / 180) * radius * factor)
                .attr('r', radius + outlineWidth);
            svg.append('svg:rect')
                .attr('clip-path', `url(#${circle3out})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', styles.outline);
            svg.append('svg:rect')
                .attr('id', operations[2].setId)
                .attr('clip-path', `url(#${circle3})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[2].entityCount === 0 }));
            // Insert 'Q₃' text bottom Circle3
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 180) / 180) * 2.6 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 180) / 180) * 2.6 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', styles.legend)
                .text(LABELS[2]);
            // Insert count value of '(Q₃)-(Q₁∩Q₃)'
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 180) / 180) * 1.1 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 180) / 180) * 1.1 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[2].entityCount === 0 }))
                .text(operations[2].entityCount);

            // Insert count value of (Q₂∩Q₃)-(Q₁)
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 360) / 180) * 0.85 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 360) / 180) * 0.85 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[3].entityCount === 0 }))
                .text(operations[3].entityCount);

            /**
             * Intersection 'Q₂∩Q₃' between Circle2 and Circle3
             */
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle2out})`)
                .append('svg:rect')
                .attr('clip-path', `url(#${circle3out})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', styles.outline);
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle2})`)
                .append('svg:rect')
                .attr('id', operations[4].setId)
                .attr('clip-path', `url(#${circle3})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[4].entityCount === 0 }));
            // Insert count value of '(Q₃)-(Q₁∩Q₃)'
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 120) / 180) * 0.85 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 120) / 180) * 0.85 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[4].entityCount === 0 }))
                .text(operations[4].entityCount);

            /**
             * Intersection 'Q₁∩Q₃' between Circle1 and Circle2 and Circle3
             */
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle3out})`)
                .append('svg:rect')
                .attr('clip-path', `url(#${circle1out})`)
                .attr('width', width)
                .attr('height', height)
                .attr('class', styles.outline);
            // Insert count value of '(S₁∩S₃)-(S₂)'
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle3})`)
                .append('svg:rect')
                .attr('id', operations[5].setId)
                .attr('clip-path', `url(#${circle1})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[5].entityCount === 0 }));

            /**
             * Intersection 'Q₁∩Q₃' between Circle1 and Circle3
             */
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle3out})`)
                .append('svg:g')
                .attr('clip-path', `url(#${circle2out})`)
                .append('svg:rect')
                .attr('clip-path', `url(#${circle1out})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', styles.outline);
            // Insert count value of '(Q₁∩Q₃)-(Q₂)'
            svg.append('text')
                .attr('x', cx + Math.sin((Math.PI * 240) / 180) * 0.85 * radius * factor)
                .attr('y', cy - Math.cos((Math.PI * 240) / 180) * 0.85 * radius * factor)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[5].entityCount === 0 }))
                .text(operations[5].entityCount);

            /**
             * Intersection 'Q₁∩Q₂∩Q₃' between Circle1 and Circle2 and Circle3
             */
            svg.append('svg:g')
                .attr('clip-path', `url(#${circle3})`)
                .append('svg:g')
                .attr('clip-path', `url(#${circle2})`)
                .append('svg:rect')
                .attr('id', operations[6].setId)
                .attr('clip-path', `url(#${circle1})`)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('class', classnames(styles.fillColor, { [styles.disabled]: operations[6].entityCount === 0 }));
            // Insert count value of '(Q₁∩Q₂∩Q₃)'
            svg.append('text')
                .attr('x', cx)
                .attr('y', cy)
                .attr('text-anchor', 'middle')
                .attr('class', classnames(styles.legend, { [styles.disabled]: operations[6].entityCount === 0 }))
                .text(operations[6].entityCount);
        }
    }, [loading, ref]);

    /**
     * Sync virtual dom and d3js
     */
    useEffect(() => {
        if (!ref?.current) return;
        if (loading) return;

        d3.select(`#${chartId}`)
            .selectAll(`.${styles.fillColor}`)
            .on('click', (d) => {
                const element = d3.select(d.srcElement);
                const active = element.classed(styles.active) ? false : true;
                element.classed(styles.active, active);
                const { id } = d.srcElement;
                if (!active) {
                    setTableSelectedSets(tableSelectedSets.filter(({ setId }) => setId != id));
                    return;
                }
                const set = operations.find((operation) => operation.setId == id);
                if (set) {
                    setTableSelectedSets([...tableSelectedSets, set]);
                }
            });
    }, [loading, ref, tableSelectedSets]);

    if (loading) {
        return <VennSekeleton height={600} width={800} />;
    }

    const operationColumnsParams = {
        dictionary,
        mode: index,
        onClick: (record: ISetOperation) => {
            setSelectedSets([record]);
            setSaveModalOpen(true);
        },
    };

    return (
        <>
            <Modal
                afterClose={() => {
                    form.resetFields();
                    setIsSaving(false);
                }}
                cancelText={dictionary.save.cancel}
                destroyOnClose
                okButtonProps={{
                    loading: isSaving,
                }}
                okText={dictionary.save.ok}
                onCancel={() => {
                    setSelectedSets([]);
                    setSaveModalOpen(false);
                }}
                onOk={() => {
                    form.submit();
                }}
                open={saveModalOpen}
                style={{ top: 200 }}
                title={dictionary.save.title}
            >
                <Form
                    className={styles.saveForm}
                    fields={[
                        {
                            name: [SET_NAME_KEY],
                            value: form.getFieldValue(SET_NAME_KEY),
                        },
                    ]}
                    form={form}
                    layout="vertical"
                    name={FORM_NAME}
                    onFinish={(values) => {
                        const existingTagNames = savedSets.map((s) => s.tag);
                        if (existingTagNames.includes(values[SET_NAME_KEY])) {
                            form.setFields([
                                {
                                    errors: [dictionary.save.alreadyExist],
                                    name: SET_NAME_KEY,
                                },
                            ]);
                            return;
                        }
                        handleSubmit({
                            callback: handleClose,
                            index,
                            name: values[SET_NAME_KEY],
                            persistent: values[PERSISTENT_KEY] === 'checked',
                            sets: selectedSets,
                        });
                        setIsSaving(true);
                    }}
                >
                    <div className={styles.saveDescription}>{dictionary.save.selected(selectedSets.length)}</div>
                    <Form.Item
                        className={styles.filterEditFormItem}
                        label={dictionary.save.label}
                        name={SET_NAME_KEY}
                        required={false}
                        rules={[
                            {
                                max: MAX_TITLE_LENGTH,
                                message: (
                                    <span>
                                        <WarningFilled /> {MAX_TITLE_LENGTH} {dictionary.save.maximumLength}
                                    </span>
                                ),
                                type: 'string',
                            },
                            {
                                message: dictionary.save.permittedCharacters,
                                pattern: new RegExp(/^[a-zA-Z0-9 ()[\]\-_:|.,]+$/i),
                                type: 'string',
                            },
                            {
                                message: dictionary.save.requiredField,
                                required: true,
                                type: 'string',
                                validateTrigger: 'onSubmit',
                            },
                        ]}
                    >
                        <Input placeholder={dictionary.save.placeholder(index)} />
                    </Form.Item>
                    <Form.Item name={PERSISTENT_KEY}>
                        <Checkbox.Group>
                            <Checkbox value="checked">
                                <Space size={8}>
                                    {dictionary.save.checkbox.label}
                                    <Tooltip title={dictionary.save.checkbox.tooltips}>
                                        <InfoCircleOutlined />
                                    </Tooltip>
                                </Space>
                            </Checkbox>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>
            <div className={styles.vennChart}>
                <div className={styles.selectWrapper}>
                    <label className={styles.selectLabel}>{dictionary.count}</label>
                    <Select
                        className={styles.select}
                        onChange={(value) => {
                            setIndex(value as Index);
                            setSelectedSets([]);
                            setTableSelectedSets([]);
                            handleIndexChange(
                                summary.map((data) => data.qbSqon),
                                value,
                            );
                        }}
                        options={[
                            {
                                label: dictionary.participants,
                                value: Index.participant,
                            },
                            {
                                label: dictionary.biospecimens,
                                value: Index.biospecimen,
                            },

                            {
                                label: dictionary.files,
                                value: Index.file,
                            },
                        ]}
                        value={index}
                    />
                </div>
                <div className={styles.venn}>
                    <div className={styles.chart}>
                        <div className={styles.chartWrapper}>
                            <div className={styles.chartContent} ref={ref}>
                                <svg height="100%" id={chartId} width="100%" />
                            </div>
                        </div>
                    </div>
                    <div className={styles.tables}>
                        <div>
                            <Typography.Title className={styles.tableTitle} level={2}>
                                {dictionary.query.title}
                            </Typography.Title>
                            <Divider className={styles.divider} />
                            <Table<ISummaryData>
                                bordered
                                columns={getSummaryColumns(index, dictionary)}
                                dataSource={summary}
                                pagination={false}
                                size="small"
                            />
                        </div>
                        <div>
                            <Typography.Title className={styles.tableTitle} level={2}>
                                {dictionary.set.title}
                            </Typography.Title>
                            <Divider className={styles.divider} />
                            <Table<ISetOperation>
                                bordered
                                columns={getOperationColumns(operationColumnsParams)}
                                dataSource={operations.map((operation) => ({
                                    ...operation,
                                    key: operation.setId,
                                }))}
                                pagination={false}
                                rowClassName={styles.row}
                                rowSelection={{
                                    getCheckboxProps: (record) => ({ disabled: record.entityCount === 0 }),
                                    onChange: (selectedRowKeys: React.Key[], selectedRows: ISetOperation[]) => {
                                        setTableSelectedSets(selectedRows);
                                        d3.selectAll(`.${styles.fillColor}`).classed(styles.active, false);
                                        selectedRowKeys.forEach((key: React.Key) => {
                                            const element = d3.select(`#${key}`);
                                            element.classed(
                                                styles.active,
                                                element.classed(styles.active) ? false : true,
                                            );
                                        });
                                    },
                                    selectedRowKeys: tableSelectedSets.map((set) => set.setId),
                                    type: 'checkbox',
                                }}
                                size="small"
                                summary={() => (
                                    <Table.Summary>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell colSpan={2} index={0}>
                                                {dictionary.set.footer}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" colSpan={1} index={1}>
                                                {total()}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell colSpan={1} index={2}>
                                                <Button
                                                    className={styles.button}
                                                    disabled={total() === 0}
                                                    icon={<ExternalLinkIcon />}
                                                    onClick={() => {
                                                        setSelectedSets(tableSelectedSets);
                                                        setSaveModalOpen(true);
                                                    }}
                                                    type="link"
                                                />
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VennChart;
