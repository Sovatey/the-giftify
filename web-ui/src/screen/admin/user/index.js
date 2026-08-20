import React from "react";
import { Layout, Tabs, Card } from 'antd';
import Sidebar from '../../sidebar';
import UserList from './userList';
import RoleList from './roleList';
import { UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Content } = Layout;

const UserScreen = () => {
    const tabItems = [
        {
            key: '1',
            label: (
                <span style={{ fontWeight: 700 }}>
                    <UserOutlined style={{ color: '#ff758c', marginRight: '6px' }} /> Staff User Accounts
                </span>
            ),
            children: <UserList />
        },
        {
            key: '2',
            label: (
                <span style={{ fontWeight: 700 }}>
                    <SafetyCertificateOutlined style={{ color: '#c084fc', marginRight: '6px' }} /> Role & Permission Matrix
                </span>
            ),
            children: <RoleList />
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
            <Sidebar />
            <Layout style={{ background: 'transparent' }}>
                <Content style={{ padding: 24, margin: 0 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, color: '#4a2e35', fontWeight: 800 }}>User & Role Permission Management</h2>
                        <span style={{ color: '#8c6a74', fontSize: '13px' }}>Manage staff credentials and fine-grained function access</span>
                    </div>

                    <Card className="glass-card">
                        <Tabs defaultActiveKey="1" items={tabItems} />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default UserScreen;
