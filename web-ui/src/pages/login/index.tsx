import { login } from '@/services/login/api';
import { history, useModel } from '@umijs/max';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import Snowfall from 'react-snowfall';
import logo from '../../assets/images/logo.jpg';

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    const userPermission = await initialState?.fetchUserPermission?.(
      userInfo?.access || '0',
    );
    if (userInfo) {
      flushSync(() => {
        setInitialState((s: any) => ({
          ...s,
          currentUser: userInfo,
          currentPermission: userPermission,
        }));
      });
    }
  };
  const handleLogin = async (values: API.LoginParams) => {
    try {
      console.log(values);

      const msg = await login({ ...values, type });
      console.log('Token:', msg.token);
      if (msg.token) {
        localStorage.setItem('accessToken', msg.token);
        // const defaultLoginSuccessMessage = intl.formatMessage({
        //   id: 'pages.login.success',
        //   defaultMessage: 'login successful!',
        // });
        message.success('login successful!');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }
      // 如果失败去设置用户错误信息
      setUserLoginState(msg);
    } catch (error) {
      // const defaultLoginFailureMessage = intl.formatMessage({
      //   id: 'pages.login.failure',
      //   defaultMessage: 'Login failed, please try again!',
      // });
      message.error('Login failed, please try again!');
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
      <Snowfall snowflakeCount={200} />

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
              rules={[
                { required: true, message: 'Please enter your username!' },
              ]}
            >
              <Input placeholder="Enter your username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter your password!' },
              ]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: '100%', backgroundColor: '#ffaead' }}
              >
                Log In
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text type="secondary">
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#ffaead' }}>
                Sign Up
              </a>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
