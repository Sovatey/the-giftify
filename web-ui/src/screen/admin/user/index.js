import React from "react";
import { Layout, Divider, Tabs, ConfigProvider } from 'antd';
import Sidebar from '../../sidebar';
import UserList from "./userList";
import RoleList from "./roleList";

const { Content } = Layout;

const UserScreen = () => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar />
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        // minHeight: 280,
                        background: '#fff',
                    }}
                >
                    <h2>User & Role</h2>
                    <Divider />
                    <ConfigProvider
                        theme={{
                            token: {
                                colorPrimary: "#ffaead", // Set your primary color for active tabs
                            },
                        }}
                    >
                        <Tabs
                            items={[
                                {
                                    label: 'User',
                                    key: '1',
                                    children: <UserList />,
                                },
                                {
                                    label: 'Role',
                                    key: '2',
                                    children: <RoleList />,
                                },
                            ]}
                        />
                    </ConfigProvider>
                </Content>
        </Layout>
    );
};

export default UserScreen;
