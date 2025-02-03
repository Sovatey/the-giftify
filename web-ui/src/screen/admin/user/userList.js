import React from "react";
import { Layout, Divider, Table, Button, Tooltip, Card, ConfigProvider } from 'antd';
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const { Content } = Layout;

const UserList = () => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout >
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#fff',
                    }}
                >
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                            <Tooltip title="Add New User">
                                <Button
                                    key="click-add"
                                    type="link"
                                    icon={<PlusOutlined />}
                                // onClick={() => setOpenModel(true)}
                                />
                            </Tooltip>
                            <Tooltip title="Refresh">
                                <Button
                                    key="click-refresh"
                                    type="link"
                                    icon={<ReloadOutlined />}
                                    style={{
                                        color: 'black',
                                    }}
                                // onClick={() => onAddHandler()}
                                />
                            </Tooltip>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'No',
                                    dataIndex: 'no',
                                    render: (_, data, index) => { return index + 1 }
                                },
                                {
                                    title: 'ID',
                                    dataIndex: 'id',
                                    key: 'id',
                                },
                                {
                                    title: 'Name',
                                    dataIndex: 'name',
                                    key: 'name',
                                },
                                {
                                    title: 'Created By',
                                    dataIndex: 'created_by',
                                    key: 'created_by',
                                },
                                {
                                    title: 'Created Date',
                                    dataIndex: 'created_date',
                                    key: 'created_date',
                                },
                            ]}
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default UserList;
