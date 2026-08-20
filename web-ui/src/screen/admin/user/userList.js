import React, { useState, useEffect } from "react";
import { Table, Button, Tooltip, Tag, Avatar, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import api from '../../../services/api';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/user/users/');
            setUsers(res.data.results || res.data || []);
        } catch (err) {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/user/roles/');
            setRoles(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateUser = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            await api.post('/user/users/', values);
            message.success('New staff user account created!');
            setModalOpen(false);
            form.resetFields();
            fetchUsers();
        } catch (err) {
            message.error(err.response?.data?.error || 'Failed to create user');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getRoleColor = (groupName) => {
        if (groupName === 'Admin') return 'magenta';
        if (groupName === 'Manager') return 'purple';
        return 'cyan';
    };

    const columns = [
        {
            title: 'No',
            dataIndex: 'no',
            render: (_, __, index) => index + 1
        },
        {
            title: 'Emp ID',
            dataIndex: 'emp_id',
            key: 'emp_id',
            render: (id) => <Tag color="pink">{id || '101'}</Tag>
        },
        {
            title: 'Staff Name',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#ff758c' }} icon={<UserOutlined />}>
                        {name?.[0] || 'U'}
                    </Avatar>
                    <strong style={{ color: '#4a2e35' }}>{name || record.username}</strong>
                </Space>
            )
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Assigned Role',
            dataIndex: 'group_name',
            key: 'group_name',
            render: (role) => (
                <Tag color={getRoleColor(role)} style={{ borderRadius: '12px', fontWeight: 700 }}>
                    {role || 'Cashier'}
                </Tag>
            )
        },
        {
            title: 'Account Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active) => (
                <Tag color={active ? 'success' : 'error'} style={{ borderRadius: '12px' }}>
                    {active ? 'Active' : 'Disabled'}
                </Tag>
            )
        },
        {
            title: 'Created Date',
            dataIndex: 'created_date',
            key: 'created_date',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                    className="btn-girly"
                >
                    Add Staff User
                </Button>
                <Tooltip title="Refresh">
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchUsers}
                        style={{ marginLeft: '8px', borderRadius: '16px' }}
                    />
                </Tooltip>
            </div>
            <Table
                loading={loading}
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={{ pageSize: 6 }}
            />

            <Modal
                title="Create Staff Account"
                open={modalOpen}
                onOk={handleCreateUser}
                confirmLoading={submitLoading}
                onCancel={() => setModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Full Staff Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Sovatey Hen" />
                    </Form.Item>
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input placeholder="e.g. sovatey" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password placeholder="Password..." />
                    </Form.Item>
                    <Form.Item name="emp_id" label="Employee ID">
                        <Input placeholder="e.g. 104" />
                    </Form.Item>
                    <Form.Item name="group" label="User Role">
                        <Select placeholder="Select role">
                            {roles.map(r => (
                                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserList;
