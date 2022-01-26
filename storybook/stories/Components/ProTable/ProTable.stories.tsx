import React from "react";
import { Meta } from "@storybook/react/types-6-0";
import ProTable from "@ferlab/ui/components/ProTable";
import { TProTableProps } from "@ferlab/ui/components/ProTable/types";

export default {
    title: "@ferlab/Components/ProTable",
    component: ProTable,
    decorators: [
        (Story) => (
            <>
                <h2>{Story}</h2>
                <Story />
            </>
        ),
    ],
} as Meta;

const ProTableStory = ({
    title,
    ...props
}: {
    title: string;
    props: TProTableProps<any>;
}) => (
    <>
        <h3>{title}</h3>
        <ProTable {...props} />
    </>
);

/* BasicTable */
export const BasicTable = ProTableStory.bind({});
BasicTable.args = {
    columns: [
        {
            key: "column_one",
            title: "Column 1",
            dataIndex: "column_one",
        },
        {
            key: "column_two",
            title: "Column 2",
            dataIndex: "column_two",
        },
        {
            key: "column_three",
            title: "Column 3",
            dataIndex: "column_three",
        },
        {
            key: "column_four",
            title: "Column 4",
            dataIndex: "column_four",
        },
    ],
    dataSource: [
        {
            column_one: "test",
            column_two: "test",
            column_three: "test",
            column_four: "test",
        },
        {
            column_one: "test",
            column_two: "test",
            column_three: "test",
            column_four: "test",
        },
        {
            column_one: "test",
            column_two: "test",
            column_three: "test",
            column_four: "test",
        },
        {
            column_one: "test",
            column_two: "test",
            column_three: "test",
            column_four: "test",
        },
    ],
    tableId: "test-table",
    headerConfig: {
        marginBtm: 12,
        extra: [<a>Extra Actions</a>],
        columnSetting: true,
        itemCount: {
            pageIndex: 1,
            pageSize: 15,
            total: 20
        },
        onColumnStateChange: () => {},
    },
};