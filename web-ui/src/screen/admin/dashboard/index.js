import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Card, Statistic, Table, Tag, List, Avatar, Spin, message } from 'antd';
import Sidebar from '../../sidebar';
import {
    DollarOutlined, ShoppingCartOutlined, AlertOutlined, TrophyOutlined,
    LineChartOutlined, HeartOutlined
} from "@ant-design/icons";
import api from '../../../services/api';

const { Content } = Layout;

const DashboardScreen = () => {
    const [metrics, setMetrics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [metricRes, orderRes] = await Promise.all([
                api.get('/sales/dashboard-metrics/'),
                api.get('/sales/orders/')
            ]);
            setMetrics(metricRes.data);
            setRecentOrders((orderRes.data.results || orderRes.data || []).slice(0, 7));
        } catch (err) {
            message.error('Failed to fetch sales dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const orderColumns = [
        {
            title: 'Invoice No',
            dataIndex: 'invoice_no',
            key: 'invoice_no',
            render: (code) => <Tag color="pink">{code}</Tag>
        },
        {
            title: 'Cashier',
            dataIndex: 'cashier_name',
            key: 'cashier_name',
            render: (name) => <strong style={{ color: '#4a2e35' }}>{name}</strong>
        },
        {
            title: 'Total Amount',
            dataIndex: 'grand_total',
            key: 'grand_total',
            render: (amt) => <span style={{ fontWeight: 800, color: '#ff758c' }}>${parseFloat(amt).toFixed(2)}</span>
        },
        {
            title: 'Payment Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (pm) => (
                <Tag color={pm === 'CASH' ? 'green' : pm === 'KHQR' ? 'blue' : 'purple'} style={{ borderRadius: '10px' }}>
                    {pm}
                </Tag>
            )
        },
        {
            title: 'Timestamp',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleString()
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
            <Sidebar />
            <Layout style={{ background: 'transparent' }}>
                <Content style={{ padding: 24, margin: 0 }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, color: '#4a2e35', fontWeight: 800 }}>
                            Sales Analytics & Dashboard <HeartOutlined style={{ color: '#ff758c' }} />
                        </h2>
                        <span style={{ color: '#8c6a74', fontSize: '13px' }}>Real-time revenue metrics and top performing gifts</span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', paddingTop: '80px' }}><Spin size="large" /></div>
                    ) : (
                        <>
                            {/* Top Metric Cards */}
                            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card className="glass-card" bodyStyle={{ padding: '20px' }}>
                                        <Statistic
                                            title={<span style={{ color: '#8c6a74', fontWeight: 600 }}>Today's Revenue</span>}
                                            value={metrics?.today_revenue || 0}
                                            precision={2}
                                            prefix={<DollarOutlined style={{ color: '#ff758c' }} />}
                                            valueStyle={{ color: '#ff758c', fontWeight: 800 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card className="glass-card" bodyStyle={{ padding: '20px' }}>
                                        <Statistic
                                            title={<span style={{ color: '#8c6a74', fontWeight: 600 }}>Today's Orders</span>}
                                            value={metrics?.today_orders || 0}
                                            prefix={<ShoppingCartOutlined style={{ color: '#c084fc' }} />}
                                            valueStyle={{ color: '#c084fc', fontWeight: 800 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card className="glass-card" bodyStyle={{ padding: '20px' }}>
                                        <Statistic
                                            title={<span style={{ color: '#8c6a74', fontWeight: 600 }}>Total All-Time Revenue</span>}
                                            value={metrics?.all_time_revenue || 0}
                                            precision={2}
                                            prefix={<LineChartOutlined style={{ color: '#38bdf8' }} />}
                                            valueStyle={{ color: '#38bdf8', fontWeight: 800 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card className="glass-card" bodyStyle={{ padding: '20px' }}>
                                        <Statistic
                                            title={<span style={{ color: '#8c6a74', fontWeight: 600 }}>Low Stock Alerts</span>}
                                            value={metrics?.low_stock_count || 0}
                                            prefix={<AlertOutlined style={{ color: '#f59e0b' }} />}
                                            valueStyle={{ color: '#f59e0b', fontWeight: 800 }}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]}>
                                {/* Recent Sales Log */}
                                <Col xs={24} lg={16}>
                                    <Card className="glass-card" title={<span style={{ fontWeight: 700, color: '#4a2e35' }}>Recent Checkout Transactions</span>}>
                                        <Table
                                            columns={orderColumns}
                                            dataSource={recentOrders}
                                            rowKey="id"
                                            pagination={false}
                                        />
                                    </Card>
                                </Col>

                                {/* Top Selling Products List */}
                                <Col xs={24} lg={8}>
                                    <Card className="glass-card" title={<span style={{ fontWeight: 700, color: '#4a2e35' }}><TrophyOutlined style={{ color: '#f59e0b' }} /> Top Selling Gifts</span>}>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={metrics?.top_products || []}
                                            renderItem={(item, idx) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Avatar style={{ backgroundColor: idx === 0 ? '#ff758c' : '#c084fc', fontWeight: 800 }}>
                                                                #{idx + 1}
                                                            </Avatar>
                                                        }
                                                        title={<strong style={{ color: '#4a2e35' }}>{item.product_name}</strong>}
                                                        description={`${item.total_qty} units sold ($${parseFloat(item.total_sales).toFixed(2)})`}
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardScreen;
