import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Row, Col, Radio
} from 'antd';
import {
  TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  GiftOutlined, HeartOutlined, SmileOutlined, FileTextOutlined, CrownOutlined, StarOutlined, FireOutlined,
  SmileOutlined as CustomEmojiIcon
} from '@ant-design/icons';
import Sidebar from '../sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { Content } = Layout;

const PRESET_ICONS = [
  { value: 'gift', label: '🎁 Gift Box' },
  { value: '💐', label: '💐 Flowers & Bouquet' },
  { value: '🧸', label: '🧸 Plush & Teddy Bear' },
  { value: '🍫', label: '🍫 Chocolates & Sweets' },
  { value: '🎂', label: '🎂 Cakes & Bakery' },
  { value: '💍', label: '💍 Jewelry & Accessories' },
  { value: '📜', label: '📜 Greeting Cards' },
  { value: '👑', label: '👑 Luxury Items' },
  { value: '👜', label: '👜 Bags & Fashion' },
  { value: '💄', label: '💄 Beauty & Cosmetics' },
  { value: '🕯️', label: '🕯️ Scented Candles' },
  { value: '🎈', label: '🎈 Party & Balloons' },
  { value: '☕', label: '☕ Mugs & Drinks' },
  { value: '🎮', label: '🎮 Toys & Games' },
  { value: '📱', label: '📱 Gadgets & Tech' },
  { value: 'star', label: '⭐ Featured Products' },
  { value: 'fire', label: '🔥 Hot Deals' },
  { value: 'custom', label: '✨ Type Any Custom Emoji...' },
];

const renderCategoryIcon = (iconName) => {
  if (!iconName) return <GiftOutlined style={{ color: '#ff758c', fontSize: 20 }} />;

  switch (iconName) {
    case 'gift': return <GiftOutlined style={{ color: '#ff758c', fontSize: 20 }} />;
    case 'heart': return <HeartOutlined style={{ color: '#ff758c', fontSize: 20 }} />;
    case 'smile': return <SmileOutlined style={{ color: '#ff9190', fontSize: 20 }} />;
    case 'file-text': return <FileTextOutlined style={{ color: '#c084fc', fontSize: 20 }} />;
    case 'crown': return <CrownOutlined style={{ color: '#f59e0b', fontSize: 20 }} />;
    case 'star': return <StarOutlined style={{ color: '#eab308', fontSize: 20 }} />;
    case 'fire': return <FireOutlined style={{ color: '#ef4444', fontSize: 20 }} />;
    default:
      // Render emoji or custom text directly!
      return <span style={{ fontSize: 22, lineHeight: 1 }}>{iconName}</span>;
  }
};

const CategoryManagement = () => {
  const { user, role } = useAuth();
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [selectedIconMode, setSelectedIconMode] = useState('preset'); // 'preset' or 'custom'
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/categories/');
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (user?.is_superuser || role === 'Admin') {
      api.get('/user/companies/').then(res => {
        setCompanies(res.data.results || res.data || []);
      }).catch(() => {});
    }
  }, [user, role]);

  const filteredCategories = categories.filter(cat => {
    if (!selectedCompanyFilter) return true;
    return cat.company === selectedCompanyFilter || cat.company_name === selectedCompanyFilter;
  });

  const handleOpenModal = (record = null) => {
    setEditingCategory(record);
    if (record) {
      const isPreset = PRESET_ICONS.some(p => p.value === record.icon && p.value !== 'custom');
      setSelectedIconMode(isPreset ? 'preset' : 'custom');
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        iconPreset: isPreset ? record.icon : 'custom',
        iconCustom: isPreset ? '' : record.icon,
      });
    } else {
      form.resetFields();
      setSelectedIconMode('preset');
      form.setFieldsValue({ iconPreset: 'gift', iconCustom: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    let finalIcon = values.iconPreset;
    if (selectedIconMode === 'custom' || values.iconPreset === 'custom') {
      finalIcon = values.iconCustom?.trim() || '🎁';
    }

    const payload = {
      name: values.name,
      description: values.description,
      icon: finalIcon || 'gift',
    };

    try {
      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory.id}/`, payload);
        message.success('Category updated successfully!');
      } else {
        await api.post('/products/categories/', payload);
        message.success('New category created successfully!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.name?.[0] || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/categories/${id}/`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      message.error('Failed to delete category');
    }
  };

  const columns = [
    {
      title: 'Category Icon & Name',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg, #fff0f3 0%, #ffe4e8 100%)',
            border: '1px solid #ffccd5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255, 117, 140, 0.15)'
          }}>
            {renderCategoryIcon(record.icon)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4a2e35' }}>{record.name}</div>
            <span style={{ fontSize: 12, color: '#8c6a74' }}>{record.description || 'No description provided'}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Icon Badge',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => (
        <Tag color="pink" style={{ borderRadius: 10, fontWeight: 700, padding: '2px 10px', fontSize: 13 }}>
          {icon || 'gift'}
        </Tag>
      )
    },
    {
      title: 'Store Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (cName) => (
        <Tag color="blue" style={{ borderRadius: 10, fontWeight: 700 }}>
          🏬 {cName || 'The Giftify'}
        </Tag>
      )
    },
    {
      title: 'Associated Products',
      dataIndex: 'product_count',
      key: 'product_count',
      render: (count) => (
        <Tag color={count > 0 ? 'purple' : 'default'} style={{ borderRadius: 10, fontWeight: 700, padding: '2px 10px' }}>
          📦 {count || 0} Products
        </Tag>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 8 }} onClick={() => handleOpenModal(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fcf8f9' }}>
      <Sidebar />
      <Layout style={{ padding: '24px 32px' }}>
        <Content>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#4a2e35', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <TagsOutlined style={{ color: '#ff758c' }} /> Category Management
              </h1>
              <p style={{ color: '#8c6a74', margin: '4px 0 0 0', fontSize: 14 }}>
                Organize your catalog with preset icons or paste any custom emoji (🧸, 💐, 🍫, ☕, 🎂)!
              </p>
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading} style={{ borderRadius: 10 }}>
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #ff758c 0%, #ff758c 100%)',
                    border: 'none', fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(255, 117, 140, 0.3)'
                  }}
                >
                  Add New Category
                </Button>
              </Space>
            </Col>
          </Row>

          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(255, 174, 173, 0.1)', border: '1px solid #ffe3e8' }}>
            {(user?.is_superuser || role === 'Admin') && (
              <div style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Filter by Store Company"
                  allowClear
                  onChange={(val) => setSelectedCompanyFilter(val)}
                  style={{ width: 220, borderRadius: 10 }}
                >
                  {companies.map(c => (
                    <Select.Option key={c.id} value={c.id}>🏬 {c.name}</Select.Option>
                  ))}
                </Select>
              </div>
            )}
            <Table
              dataSource={filteredCategories}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>

          {/* Modal for Create / Edit Category */}
          <Modal
            title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Product Category'}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
              <Form.Item name="name" label="Category Name" rules={[{ required: true, message: 'Please enter category name' }]}>
                <Input placeholder="e.g. Teddy Bears, Flowers, Chocolates..." />
              </Form.Item>

              <Form.Item label="Choose Icon Mode">
                <Radio.Group
                  value={selectedIconMode}
                  onChange={(e) => setSelectedIconMode(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="preset">🎨 Preset Icons & Emojis</Radio.Button>
                  <Radio.Button value="custom">✨ Type Custom Emoji / Text</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {selectedIconMode === 'preset' ? (
                <Form.Item name="iconPreset" label="Select Preset Icon" rules={[{ required: true }]}>
                  <Select
                    placeholder="Choose icon or emoji..."
                    onChange={(val) => {
                      if (val === 'custom') setSelectedIconMode('custom');
                    }}
                  >
                    {PRESET_ICONS.map(opt => (
                      <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item
                  name="iconCustom"
                  label="Type or Paste Any Custom Emoji (e.g. 🧸, 💐, 🕯️, ☕, 🎂, 🎀)"
                  rules={[{ required: true, message: 'Please enter or paste an emoji' }]}
                >
                  <Input placeholder="Paste any emoji or type text here..." style={{ fontSize: 18 }} maxLength={10} />
                </Form.Item>
              )}

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Brief category summary..." />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CategoryManagement;
