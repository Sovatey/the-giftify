import React, { useState, useEffect } from "react";
import { Table, Button, Tooltip, Tag, Avatar, Modal, Form, Input, Select, message, Space, Popconfirm, Switch } from 'antd';
import { PlusOutlined, ReloadOutlined, UserOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from '../../../services/api';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchCompanies();
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

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/user/companies/');
            setCompanies(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenCreateUser = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true, companies: [] });
        setModalOpen(true);
    };

    const handleOpenEditUser = (record) => {
        setEditingUser(record);
        form.resetFields();

        let assignedCompanyIds = [];
        if (record.companies_details && record.companies_details.length > 0) {
            assignedCompanyIds = record.companies_details.map(c => c.id);
        } else if (Array.isArray(record.companies) && record.companies.length > 0) {
            assignedCompanyIds = record.companies;
        } else if (record.company) {
            assignedCompanyIds = [record.company];
        }

        form.setFieldsValue({
            name: record.name,
            username: record.username,
            emp_id: record.emp_id,
            company: record.company,
            companies: assignedCompanyIds,
            group: record.group,
            is_active: record.is_active !== undefined ? record.is_active : true,
        });
        setModalOpen(true);
    };

    const handleSaveUser = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            
            // Set primary company if multi-companies selected
            if (values.companies && values.companies.length > 0) {
                values.company = values.companies[0];
            }

            // Omit blank password on edit
            if (editingUser && !values.password) {
                delete values.password;
            }

            if (editingUser) {
                await api.put(`/user/users/${editingUser.id}/`, values);
                message.success('Staff user account updated successfully!');
            } else {
                await api.post('/user/users/', values);
                message.success('New staff user account created!');
            }

            setModalOpen(false);
            form.resetFields();
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
            message.error(err.response?.data?.error || 'Failed to save user account');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            await api.delete(`/user/users/${id}/`);
            message.success('User account deleted');
            fetchUsers();
        } catch (err) {
            message.error('Failed to delete user account');
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
            title: 'Assigned Store Companies',
            dataIndex: 'companies_details',
            key: 'companies',
            render: (_, record) => {
                const compList = record.companies_details || [];
                if (compList.length > 0) {
                    return (
                        <Space size={4} wrap>
                            {compList.map(c => (
                                <Tag key={c.id} color="green" style={{ borderRadius: '12px', fontWeight: 700 }}>
                                    🏬 {c.name}
                                </Tag>
                            ))}
                        </Space>
                    );
                }
                return (
                    <Tag color="green" style={{ borderRadius: '12px', fontWeight: 700 }}>
                        🏬 {record.company_name || 'Global / All'}
                    </Tag>
                );
            }
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
        {
            title: 'Actions',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit User Account">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditUser(record)}
                            style={{ borderRadius: '8px' }}
                        />
                    </Tooltip>
                    <Popconfirm title="Delete this staff user account?" onConfirm={() => handleDeleteUser(record.id)}>
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ borderRadius: '8px' }}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const filteredUsers = users.filter(u => {
        if (!selectedCompanyFilter) return true;
        const assignedCompIds = (u.companies_details || []).map(c => c.id);
        return !selectedCompanyFilter || u.company === selectedCompanyFilter || u.company_name === selectedCompanyFilter || assignedCompIds.includes(selectedCompanyFilter);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Select
                    placeholder="Filter by Store Company"
                    allowClear
                    onChange={(val) => setSelectedCompanyFilter(val)}
                    style={{ width: 220, borderRadius: '10px' }}
                >
                    {companies.map(c => (
                        <Select.Option key={c.id} value={c.id}>🏬 {c.name}</Select.Option>
                    ))}
                </Select>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreateUser}
                        className="btn-girly"
                    >
                        Add Staff User
                    </Button>
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchUsers}
                            loading={loading}
                            style={{ borderRadius: '16px' }}
                        />
                    </Tooltip>
                </Space>
            </div>
            <Table
                loading={loading}
                columns={columns}
                dataSource={filteredUsers}
                rowKey="id"
                pagination={{ pageSize: 6 }}
            />

            <Modal
                title={editingUser ? "Edit Staff User Account" : "Create Staff Account"}
                open={modalOpen}
                onOk={handleSaveUser}
                confirmLoading={submitLoading}
                onCancel={() => setModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Full Staff Name" rules={[{ required: true, message: 'Enter full staff name' }]}>
                        <Input placeholder="e.g. Sovatey Hen" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Enter username' }]}>
                        <Input placeholder="e.g. sovatey" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={editingUser ? "Password (Leave blank to keep existing)" : "Password"}
                        rules={editingUser ? [] : [{ required: true, message: 'Enter password' }]}
                    >
                        <Input.Password placeholder={editingUser ? "New password (optional)..." : "Password..."} style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="emp_id" label="Employee ID">
                        <Input placeholder="e.g. 104" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="companies" label="Assigned Store Companies (Select Multiple)">
                        <Select mode="multiple" placeholder="Select one or multiple store companies..." allowClear style={{ borderRadius: 8 }}>
                            {companies.map(c => (
                                <Select.Option key={c.id} value={c.id}>🏬 {c.name} ({c.code})</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="group" label="User Role">
                        <Select placeholder="Select role" style={{ borderRadius: 8 }}>
                            {roles.map(r => (
                                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {editingUser && (
                        <Form.Item name="is_active" label="Account Status" valuePropName="checked">
                            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default UserList;
