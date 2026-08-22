import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, Space, Tag } from "antd";
import { UserOutlined, LockOutlined, HeartOutlined, KeyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo-round.png";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

const LoginScreen = () => {
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setErrorMsg("");
    const res = await login(values.username, values.password);
    if (res.success) {
      if (res.role === "Cashier") {
        navigate("/pos");
      } else {
        navigate("/dashboard");
      }
    } else {
      setErrorMsg(res.error || "Login failed. Please check credentials.");
    }
  };

  const handleQuickLogin = (user, pass) => {
    form.setFieldsValue({ username: user, password: pass });
    onFinish({ username: user, password: pass });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #fff0f3 0%, #f3e8ff 50%, #e0f2fe 100%)",
        padding: "20px",
      }}
    >
      <Card
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "24px 16px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 15px 35px -5px rgba(255, 174, 173, 0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src={Logo}
            alt="The Giftify Logo"
            style={{
              width: "75px",
              height: "75px",
              marginBottom: "12px",
              filter: "drop-shadow(0 6px 12px rgba(255, 117, 140, 0.3))",
            }}
          />
          <Title level={2} style={{ color: "#4a2e35", margin: 0, fontWeight: 800 }}>
            The Giftify <HeartOutlined style={{ color: "#ff758c" }} />
          </Title>
          <Text style={{ color: "#8c6a74", fontSize: "14px", fontWeight: 600 }}>
            Point of Sale & Stock System
          </Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: "20px", borderRadius: "12px" }}
          />
        )}

        <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#ff758c" }} />}
              placeholder="Username"
              style={{ borderRadius: "14px" }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#ff758c" }} />}
              placeholder="Password"
              style={{ borderRadius: "14px" }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: "24px" }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="btn-girly"
              style={{
                height: "48px",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                background: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
                borderColor: "#ff758c",
                color: "#ffffff",
                borderRadius: "24px",
                boxShadow: "0 8px 20px rgba(255, 117, 140, 0.45)"
              }}
            >
              Sign In to POS
            </Button>
          </Form.Item>
        </Form>

        {/* Demo Quick Logins for fast testing */}
        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed #ffaead" }}>
          <Text style={{ fontSize: "12px", color: "#8c6a74", fontWeight: 700, display: "block", marginBottom: "8px", textAlign: "center" }}>
            <KeyOutlined /> Demo Quick Login Accounts:
          </Text>
          <Space style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
            <Tag
              color="magenta"
              style={{ cursor: "pointer", borderRadius: "12px", padding: "4px 10px", fontWeight: 700 }}
              onClick={() => handleQuickLogin("admin", "admin123")}
            >
              Admin
            </Tag>
            <Tag
              color="purple"
              style={{ cursor: "pointer", borderRadius: "12px", padding: "4px 10px", fontWeight: 700 }}
              onClick={() => handleQuickLogin("manager", "manager123")}
            >
              Manager
            </Tag>
            <Tag
              color="cyan"
              style={{ cursor: "pointer", borderRadius: "12px", padding: "4px 10px", fontWeight: 700 }}
              onClick={() => handleQuickLogin("cashier", "cashier123")}
            >
              Cashier
            </Tag>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
