import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Table, Tag, Button, Modal, Form, Input, Switch, Space, message, Popconfirm, Tooltip, Row, Col
} from 'antd';
import {
  ShopOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import Sidebar from '../sidebar';
import api from '../../services/api';

const { Content } = Layout;

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [form] = Form.useForm();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/companies/');
      setCompanies(res.data.results || res.data || []);
    } catch (err) {
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingCompany(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        code: record.code,
        phone: record.phone,
        email: record.email,
        address: record.address,
        is_active: record.is_active !== undefined ? record.is_active : true,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingCompany) {
        await api.put(`/user/companies/${editingCompany.id}/`, values);
        message.success('Company updated successfully!');
      } else {
        await api.post('/user/companies/', values);
        message.success('New company created successfully!');
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.code?.[0] || 'Failed to save company');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/user/companies/${id}/`);
      message.success('Company deleted successfully');
      fetchCompanies();
    } catch (err) {
      message.error('Failed to delete company');
    }
  };

  const columns = [
    {
      title: 'Company Name & Code',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700
          }}>
            <ShopOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{record.name}</div>
            <Tag color="emerald" style={{ borderRadius: 8, fontSize: 11, margin: 0, fontWeight: 700 }}>
              CODE: {record.code}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Contact Phone & Email',
      key: 'contact',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>📞 {record.phone || 'N/A'}</div>
          <div style={{ color: '#6b7280' }}>✉️ {record.email || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (val) => <span style={{ fontSize: 12, color: '#4b5563' }}>{val || 'N/A'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'} icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />} style={{ borderRadius: 10, fontWeight: 700 }}>
          {active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 8 }} onClick={() => handleOpenModal(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this company?" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <Layout style={{ padding: '24px 32px' }}>
        <Content>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShopOutlined style={{ color: '#10b981' }} /> Multi-Company Management
              </h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: 14 }}>
                Manage store tenants, assign company codes, and view company details.
              </p>
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchCompanies} style={{ borderRadius: 10 }}>
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none', fontWeight: 700
                  }}
                >
                  Add New Company
                </Button>
              </Space>
            </Col>
          </Row>

          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
            <Table
              dataSource={companies}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>

          {/* Modal for Creating / Editing Company */}
          <Modal
            title={editingCompany ? `Edit Company: ${editingCompany.name}` : 'Create New Store Company'}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Company Name" rules={[{ required: true, message: 'Please enter company name' }]}>
                    <Input placeholder="e.g. The Giftify" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="code" label="Company Code (Unique)" rules={[{ required: true, message: 'Please enter unique code' }]}>
                    <Input placeholder="e.g. giftify or store_02" disabled={!!editingCompany} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="Phone Number">
                    <Input placeholder="+855 12 345 678" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="Email Address">
                    <Input placeholder="info@giftify.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="Store Address">
                <Input.TextArea rows={2} placeholder="Street address, City..." />
              </Form.Item>

              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CompanyManagement;
