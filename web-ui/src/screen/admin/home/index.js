import React from "react";
import { Layout, Divider } from 'antd';
import Sidebar from '../../sidebar';

const { Content } = Layout;

const HomePage = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout >
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
          }}
        >
          <h2>Home Page</h2>
          <Divider />
          <p>This is the home page with a sidebar.</p>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HomePage;
