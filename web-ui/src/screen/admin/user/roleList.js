import React, { useState, useEffect } from "react";
import { Table, Checkbox, Button, Select, message, Space, Alert } from 'antd';
import { SaveOutlined } from "@ant-design/icons";
import api from '../../../services/api';

const RoleList = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/user/roles/');
            const roleData = res.data.results || res.data || [];
            setRoles(roleData);
            if (roleData.length > 0) {
                setSelectedRole(roleData[0].id);
                fetchPermissions(roleData[0].id);
            }
        } catch (err) {
            message.error('Failed to load user roles');
        }
    };

    const fetchPermissions = async (roleId) => {
        setLoading(true);
        try {
            const res = await api.get(`/user/permissions/?group=${roleId}`);
            setPermissions(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (roleId) => {
        setSelectedRole(roleId);
        fetchPermissions(roleId);
    };

    const handleTogglePerm = (permId, field) => {
        setPermissions(prev => prev.map(p => {
            if (p.id === permId) {
                return { ...p, [field]: !p[field] };
            }
            return p;
        }));
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        try {
            await Promise.all(permissions.map(p => api.put(`/user/permissions/${p.id}/`, p)));
            message.success('Role permissions matrix updated successfully!');
        } catch (err) {
            message.error('Failed to save permission matrix');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: 'Function / Route Module',
            dataIndex: 'route_name',
            key: 'route_name',
            render: (name, record) => (
                <div>
                    <strong style={{ color: '#4a2e35' }}>{name}</strong>
                    <div style={{ fontSize: '11px', color: '#8c6a74' }}>{record.route_path}</div>
                </div>
            )
        },
        {
            title: 'View Access',
            dataIndex: 'view',
            key: 'view',
            align: 'center',
            render: (val, record) => (
                <Checkbox
                    checked={val}
                    onChange={() => handleTogglePerm(record.id, 'view')}
                />
            )
        },
        {
            title: 'Add / Create',
            dataIndex: 'add',
            key: 'add',
            align: 'center',
            render: (val, record) => (
                <Checkbox
                    checked={val}
                    onChange={() => handleTogglePerm(record.id, 'add')}
                />
            )
        },
        {
            title: 'Edit / Update',
            dataIndex: 'edit',
            key: 'edit',
            align: 'center',
            render: (val, record) => (
                <Checkbox
                    checked={val}
                    onChange={() => handleTogglePerm(record.id, 'edit')}
                />
            )
        },
        {
            title: 'Delete / Remove',
            dataIndex: 'delete',
            key: 'delete',
            align: 'center',
            render: (val, record) => (
                <Checkbox
                    checked={val}
                    onChange={() => handleTogglePerm(record.id, 'delete')}
                />
            )
        },
    ];

    const currentRoleObj = roles.find(r => r.id === selectedRole);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Space>
                    <span style={{ fontWeight: 700, color: '#4a2e35' }}>Select Role to Configure:</span>
                    <Select
                        value={selectedRole}
                        onChange={handleRoleChange}
                        style={{ width: 200, borderRadius: '16px' }}
                    >
                        {roles.map(r => (
                            <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                        ))}
                    </Select>
                </Space>

                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSavePermissions}
                    className="btn-girly"
                >
                    Save Permission Matrix
                </Button>
            </div>

            {currentRoleObj && (
                <Alert
                    message={`Configuring Permissions for: ${currentRoleObj.name}`}
                    description={currentRoleObj.description || 'Controls module visibility and action permissions.'}
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px', borderRadius: '14px' }}
                />
            )}

            <Table
                loading={loading}
                columns={columns}
                dataSource={permissions}
                rowKey="id"
                pagination={false}
            />
        </div>
    );
};

export default RoleList;
