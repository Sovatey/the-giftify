import React, { useState } from "react";
import { Layout, Menu, Button, Avatar, Tag } from "antd";
import {
    ShoppingOutlined,
    LineChartOutlined,
    InboxOutlined,
    UserOutlined,
    LogoutOutlined,
    RightOutlined,
    LeftOutlined,
    HeartOutlined
} from "@ant-design/icons";
import Logo from "../assets/images/logo-round.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ConfigProvider } from 'antd';
import { useAuth } from "../context/AuthContext";

const { Sider } = Layout;

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role, logout, hasPermission } = useAuth();

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const handleMenuClick = ({ key }) => {
        if (key === "logout") {
            logout();
            navigate('/');
        } else {
            navigate(key);
        }
    };

    const allMenuItems = [
        {
            key: "/pos",
            label: "POS Checkout",
            icon: <ShoppingOutlined style={{ fontSize: '18px', color: '#ff758c' }} />,
            permissionKey: "/pos"
        },
        {
            key: "/inventory",
            label: "Inventory & Stock",
            icon: <InboxOutlined style={{ fontSize: '18px', color: '#ff9190' }} />,
            permissionKey: "/inventory"
        },
        {
            key: "/dashboard",
            label: "Sales Analytics",
            icon: <LineChartOutlined style={{ fontSize: '18px', color: '#c084fc' }} />,
            permissionKey: "/dashboard"
        },
        {
            key: "/user",
            label: "User & Role Management",
            icon: <UserOutlined style={{ fontSize: '18px', color: '#38bdf8' }} />,
            permissionKey: "/user"
        },
    ];

    // Filter menu items dynamically based on user's role permissions!
    const filteredMenuItems = allMenuItems.filter(item => hasPermission(item.permissionKey, 'view'));

    const getRoleColor = (r) => {
        if (r === 'Admin') return '#ff758c';
        if (r === 'Manager') return '#c084fc';
        return '#38bdf8';
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#ffaead',
                    colorBgTextHover: '#fff0f3',
                    borderRadius: 12,
                },
            }}
        >
            <Sider
                width={260}
                collapsed={collapsed}
                style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "4px 0 20px rgba(255, 174, 173, 0.15)",
                    position: "relative",
                    borderRight: "1px solid rgba(255, 174, 173, 0.2)"
                }}
            >
                {/* Header Logo */}
                <div
                    style={{
                        padding: "20px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderBottom: "1px dashed rgba(255, 174, 173, 0.4)",
                        marginBottom: "16px",
                    }}
                >
                    <img
                        src={Logo}
                        alt="The Giftify"
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            boxShadow: "0 4px 10px rgba(255, 117, 140, 0.3)"
                        }}
                    />
                    {!collapsed && (
                        <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column" }}>
                            <strong style={{ fontSize: "19px", color: "#4a2e35", letterSpacing: "0.5px" }}>
                                The Giftify <HeartOutlined style={{ color: "#ff758c" }} />
                            </strong>
                            <span style={{ fontSize: "11px", color: "#8c6a74", fontWeight: 600 }}>POS & Inventory</span>
                        </div>
                    )}
                </div>

                {/* Toggle Collapse Button */}
                <Button
                    type="default"
                    icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                    onClick={toggleSidebar}
                    style={{
                        position: "absolute",
                        top: "22px",
                        right: "-14px",
                        zIndex: 10,
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1px solid #ffaead",
                        background: "#fff",
                        color: "#ff758c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer"
                    }}
                />

                {/* User Info Card */}
                {!collapsed && (
                    <div
                        style={{
                            margin: "0 12px 16px 12px",
                            padding: "12px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #fff0f3 0%, #f3e8ff 100%)",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            border: "1px solid rgba(255, 174, 173, 0.3)"
                        }}
                    >
                        <Avatar style={{ backgroundColor: '#ff758c' }} icon={<UserOutlined />}>
                            {user?.name?.[0] || 'U'}
                        </Avatar>
                        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#4a2e35', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {user?.name || user?.username || 'Guest Staff'}
                            </div>
                            <div>
                                <Tag color={getRoleColor(role)} style={{ borderRadius: '10px', fontSize: '11px', margin: 0, fontWeight: 700, padding: '2px 10px' }}>
                                    {role}
                                </Tag>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dynamic Menu based on Permissions */}
                <Menu
                    mode="inline"
                    onClick={handleMenuClick}
                    selectedKeys={[location.pathname]}
                    style={{
                        borderRight: 'none',
                        background: 'transparent',
                        fontWeight: 600,
                    }}
                >
                    {filteredMenuItems.map(item => (
                        <Menu.Item key={item.key} icon={item.icon} style={{ borderRadius: '12px', margin: '4px 12px' }}>
                            {item.label}
                        </Menu.Item>
                    ))}
                </Menu>

                {/* Bottom Logout Button */}
                <div style={{ position: "absolute", bottom: "16px", width: "100%", padding: "0 12px" }}>
                    <Button
                        block
                        type="text"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={() => handleMenuClick({ key: "logout" })}
                        style={{
                            borderRadius: "12px",
                            fontWeight: 700,
                            textAlign: collapsed ? "center" : "left",
                            background: "rgba(255, 240, 243, 0.6)",
                        }}
                    >
                        {!collapsed && "Log Out"}
                    </Button>
                </div>
            </Sider>
        </ConfigProvider>
    );
};

export default Sidebar;
