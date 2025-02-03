import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Typography, Card, message,Modal } from 'antd';
import Snowfall from 'react-snowfall';
import logo from '../assets/images/logo.jpg';
import axios from 'axios';
import SignupModelForm from "./sign-up";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [signupModel, setSignupModel] = useState(false)
  const [loading, setLoading] = useState(false)
  // const handleLogin = (values) => {
  //   const { username, password } = values;

  //   if (username === 'admin' && password === '123456') {
  //     message.success('Login successful!');
  //     navigate('/dashboard');  // Navigate to dashboard after login
  //   } else {
  //     message.error('Invalid username or password!');
  //   }
  // };

  const handleLogin = async (values) => {
    try {
      const response = await axios.post(`/api/user/login/`, values);
      if (response.status === 200) {
        message.success('Login successful!');
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      } else {
        message.error('Invalid username or password!');
      }
    } catch (error) {
      message.error('Invalid username or password!');
    }
  };

  const handleRegister = async (values) => {
    Modal.confirm({
      title: "Submit",
      content: 'are you sure',
      onOk: async () => {
        try {
          const response = await axios.post(`/api/user/register/`, values);
          console.log(response)
          if (response.status === 200) {
            message.success('Register successful!');
            setSignupModel(false)
          } else {
            message.error('Invalid');
          }

        } catch (error) {
          console.log('ds')
          message.error('Invalid');
        }
      }
    })

  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(to bottom, #e0f7fa, #ffffff)',
        position: 'relative',
      }}
    >
      <Snowfall snowflakeCount={200} />

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
              <Button type="primary" htmlType="submit" style={{ width: '100%', backgroundColor: '#ffaead' }}>
                Log In
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text type="secondary">
              Don't have an account? <a onClick={() => setSignupModel(true)} style={{ color: '#ffaead' }}>Sign Up</a>
            </Typography.Text>
          </div>
        </Card>
      </div>
      <SignupModelForm
        title="Sign Up"
        loading={loading}
        open={signupModel}
        setOpen={setSignupModel}
        onSubmit={async (e) => {
          try {
            setLoading(true)
            await handleRegister(e) // use await to get loading when submit
          } catch (e) {

          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => setSignupModel(false)}
      />
    </div>

  );
};

export default LoginScreen;
