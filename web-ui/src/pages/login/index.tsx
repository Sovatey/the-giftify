import { PageContainer } from '@ant-design/pro-components';
import { Button, Form, Input, Typography, Card, message } from 'antd';
import { useNavigate } from '@umijs/max';
import logo from '../../assets/images/logo.jpg';
import Snowfall from 'react-snowfall';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (values: { username: string; password: string }) => {
    const { username, password } = values;

    if (username === 'admin' && password === '123456') {
      message.success('Login successful!');
      navigate('/dashboard');
    } else {
      message.error('Invalid username or password!');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(to bottom, #e0f7fa, #ffffff)',
        // background: '#34495e',
        position: 'relative', // Make the parent container relative to position the snow effect
      }}
    >
      {/* Snowfall Effect */}
      <Snowfall snowflakeCount={200}  />

      {/* Container for Image and Login Card */}
      <div
        style={{
          display: 'flex',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 300,
            backgroundColor: '#f0f8ff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={logo}
            alt="Login Illustration"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        <Card
          style={{
            width: 400,
            padding: '24px',
          }}
          bordered={false}
        >
          <Typography.Title level={3} style={{ textAlign: 'center' }}>
            Login
          </Typography.Title>
          <Form
            layout="vertical"
            onFinish={handleLogin}
            initialValues={{ username: '', password: '' }}
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: 'Please enter your username!' }]}
            >
              <Input placeholder="Enter your username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%',backgroundColor:'#ffaead' }}>
                Log In
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text type="secondary">
              Don't have an account? <a href="/register" style={{color:'#ffaead'}}>Sign Up</a>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
