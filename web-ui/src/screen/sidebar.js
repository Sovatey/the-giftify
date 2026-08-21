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
    HeartOutlined,
    ShareAltOutlined
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
        {
            key: "/social-publisher",
            label: "Social Auto-Post",
            icon: <ShareAltOutlined style={{ fontSize: '18px', color: '#f43f5e' }} />,
            permissionKey: "/social-publisher"
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
        <div style={{ width: collapsed ? 80 : 260, minWidth: collapsed ? 80 : 260, flexShrink: 0, transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)' }}>
            <Sider
                width={collapsed ? 80 : 260}
                collapsed={collapsed}
                style={{
                    background: "rgba(255, 255, 255, 0.96)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "4px 0 20px rgba(255, 174, 173, 0.15)",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100vh",
                    zIndex: 1000,
                    borderRight: "1px solid rgba(255, 174, 173, 0.3)",
                    overflow: "visible"
                }}
            >
                {/* Toggle Collapse Button - Floating on right border */}
                <Button
                    type="default"
                    icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                    onClick={toggleSidebar}
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "-14px",
                        zIndex: 1100,
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1.5px solid #ffaead",
                        background: "#ffffff",
                        color: "#ff758c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 10px rgba(255, 117, 140, 0.25)",
                        cursor: "pointer"
                    }}
                />

                {/* Inner Scrollable Container */}
                <div
                    style={{
                        height: "calc(100vh - 70px)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    {/* Header Logo */}
                    <div
                        style={{
                            padding: "20px 16px 16px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: collapsed ? "center" : "flex-start",
                            borderBottom: "1px dashed rgba(255, 174, 173, 0.4)",
                            marginBottom: "14px",
                            flexShrink: 0
                        }}
                    >
                        <img
                            src={Logo}
                            alt="The Giftify"
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                boxShadow: "0 4px 10px rgba(255, 117, 140, 0.3)",
                                flexShrink: 0
                            }}
                        />
                        {!collapsed && (
                            <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column" }}>
                                <strong style={{ fontSize: "18px", color: "#4a2e35", letterSpacing: "0.5px" }}>
                                    The Giftify <HeartOutlined style={{ color: "#ff758c" }} />
                                </strong>
                                <span style={{ fontSize: "11px", color: "#8c6a74", fontWeight: 600 }}>POS & Inventory</span>
                            </div>
                        )}
                    </div>

                    {/* User Info Card */}
                    {!collapsed && (
                        <div
                            style={{
                                margin: "0 12px 14px 12px",
                                padding: "10px 12px",
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, #fff0f3 0%, #f3e8ff 100%)",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "1px solid rgba(255, 174, 173, 0.3)",
                                flexShrink: 0
                            }}
                        >
                            <Avatar style={{ backgroundColor: '#ff758c' }} icon={<UserOutlined />}>
                                {user?.name?.[0] || 'U'}
                            </Avatar>
                            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: '#4a2e35', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {user?.name || user?.username || 'Guest Staff'}
                                </div>
                                <div>
                                    <Tag color={getRoleColor(role)} style={{ borderRadius: '10px', fontSize: '10px', margin: 0, fontWeight: 700, padding: '1px 8px' }}>
                                        {role}
                                    </Tag>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Menu */}
                    <Menu
                        mode="inline"
                        onClick={handleMenuClick}
                        selectedKeys={[location.pathname]}
                        style={{
                            borderRight: 'none',
                            background: 'transparent',
                            fontWeight: 600,
                            flex: 1
                        }}
                    >
                        {filteredMenuItems.map(item => (
                            <Menu.Item key={item.key} icon={item.icon} style={{ borderRadius: '12px', margin: '4px 10px' }}>
                                {item.label}
                            </Menu.Item>
                        ))}
                    </Menu>
                </div>

                {/* Bottom Logout Button */}
                <div style={{ position: "absolute", bottom: "14px", width: "100%", padding: "0 12px", flexShrink: 0 }}>
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
                            background: "rgba(255, 240, 243, 0.8)",
                            border: "1px solid rgba(255, 174, 173, 0.3)"
                        }}
                    >
                        {!collapsed && "Log Out"}
                    </Button>
                </div>
            </Sider>
        </div>
        </ConfigProvider>
    );
};

export default Sidebar;
