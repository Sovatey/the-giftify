import React, { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
    HomeOutlined,
    LineChartOutlined,
    ImportOutlined,
    RightOutlined,
    LeftOutlined,
    LogoutOutlined,
    UserOutlined,
    UserSwitchOutlined
} from "@ant-design/icons";
import Logo from "../assets/images/logo-round.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ConfigProvider } from 'antd';

const { Sider } = Layout;

const Sidebar = ({ username }) => {
    const [collapsed, setCollapsed] = useState(false); // State to toggle the sidebar
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location

    const toggleSidebar = () => {
        setCollapsed(!collapsed); // Toggle the state
    };

    const handleMenuClick = ({ key }) => {
        if (key === "logout") {
            navigate("/login");
        } else {
            navigate(key); // Navigate to the route corresponding to the key
        }
    };

    return (

        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#ffaead',
                },
            }}
        >
            <Sider
                width={250}
                collapsed={collapsed}
                style={{
                    background: "#fff",
                    boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        padding: "16px",
                        textAlign: "right",
                        display: "flex",
                        justifyContent: "space-between", // To push logo and toggle button apart
                        alignItems: "center", // Vertically align the elements
                        borderBottom: "2px solid rgba(0, 0, 0, 0.1)",
                        marginBottom: "16px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                            src={Logo}
                            alt="Shop Logo"
                            style={{ width: "30px", height: "auto", marginRight: "8px" }}
                        />
                        {!collapsed && (
                            <strong style={{ fontSize: "18px" }}>The Giftify</strong>
                        )}
                    </div>
                </div>

                <Button
                    type="link"
                    icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                    onClick={toggleSidebar}
                    style={{
                        position: "absolute",
                        top: "15px",
                        right: "2px",
                        padding: "0",
                        fontSize: "12px",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%", // Make it round
                        color: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                />

                <Menu
                    mode="inline"
                    onClick={handleMenuClick}
                    style={{backgroundColor:'#fff'}}
                    selectedKeys={[location.pathname]}
                >
                    <Menu.Item key="/dashboard" icon={<LineChartOutlined />}>
                        Dashboard
                    </Menu.Item>
                    <Menu.Item key="/home" icon={<HomeOutlined />}>
                        Home
                    </Menu.Item>
                    <Menu.Item key="/inventory" icon={<ImportOutlined />}>
                        Inventory
                    </Menu.Item>
                    <Menu.Item key="/user" icon={<UserOutlined />}>
                        User & Role
                    </Menu.Item>
                    <div
                    style={{
                        position: "absolute",
                        bottom: "16px",
                        width: "100%",
                    }}
                >
                    <Menu
                        mode="inline"
                        onClick={handleMenuClick}
                        style={{ backgroundColor: '#fff' }}
                    >
                        <Menu.Item key="logout" icon={<LogoutOutlined />}>
                            Logout
                        </Menu.Item>
                    </Menu>
                </div>
                </Menu>
            </Sider>
        </ConfigProvider>
    );
};

export default Sidebar;
