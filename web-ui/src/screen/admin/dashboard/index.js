import React from "react";
import { Layout, Divider } from 'antd';
import Sidebar from '../../sidebar';
import { useLocation } from 'react-router-dom';

const { Content } = Layout;

const DashboardScreen = () => {
    const location = useLocation();
    const username = location.state;
    const token = localStorage.getItem('token');
    console.log('Stored Token:', token);
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {<Sidebar username={username} />}
            <Layout >
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#fff',
                    }}
                >
                    <h2>Dashboard</h2>
                    <Divider />
                    <p>This is the Dashboard Screen</p>
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardScreen;
