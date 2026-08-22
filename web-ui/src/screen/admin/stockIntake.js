import React, { useState, useEffect } from "react";
import {
  Layout, Table, Button, Card, Tag, Space, Input, Select, message, Avatar, Row, Col, Statistic, Modal, Form, InputNumber, DatePicker
} from 'antd';
import Sidebar from '../sidebar';
import {
  InboxOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined,
  DollarOutlined, CheckCircleOutlined, AlertOutlined, CalendarOutlined, HeartOutlined
} from "@ant-design/icons";
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUrl';

const { Content } = Layout;

const StockIntakeScreen = () => {
  const { user, role } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState(null);

  // New Intake Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    if (user?.is_superuser || role === 'Admin') {
      api.get('/user/companies/').then(res => setCompanies(res.data.results || res.data || [])).catch(() => { });
    }
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moveRes, prodRes] = await Promise.all([
        api.get('/inventory/stock-movements/', { params: { all_companies: 'true' } }),
        api.get('/products/', { params: { all_companies: 'true' } })
      ]);
      setMovements(moveRes.data.results || moveRes.data || []);
      setProducts(prodRes.data.results || prodRes.data || []);
    } catch (err) {
      message.error('Failed to load stock movements data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewIntake = async () => {
    form.resetFields();
    try {
      const prodRes = await api.get('/products/', { params: { all_companies: 'true' } });
      setProducts(prodRes.data.results || prodRes.data || []);
    } catch (e) { }

    form.setFieldsValue({
      movement_type: 'RESTOCK',
      qty: 10,
      unit_price: 0,
      received_date: dayjs(),
      order_date: dayjs()
    });
    setIsModalOpen(true);
  };

  const handleSaveIntake = async (values) => {
    setSubmitLoading(true);
    try {
      const selectedProd = products.find(p => p.id === values.product_id);
      const payload = {
        product: values.product_id,
        company: selectedProd ? (selectedProd.company || selectedProd.company_id) : undefined,
        movement_type: values.movement_type || 'RESTOCK',
        qty: parseInt(values.qty),
        unit_price: parseFloat(values.unit_price || 0),
        delivery_price: parseFloat(values.delivery_price || 0),
        sub_total_price: (parseFloat(values.unit_price || 0) * parseInt(values.qty)) + parseFloat(values.delivery_price || 0),
        supplier: values.supplier || 'Default Supplier',
        description: values.description || 'Stock Intake Entry',
        received_date: values.received_date ? values.received_date.format('YYYY-MM-DD') : undefined,
        created_by: user?.name || user?.username || 'Admin'
      };

      await api.post('/inventory/stock-movements/', payload);
      message.success('Stock intake recorded successfully! Product inventory updated.');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Failed to record stock intake');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredMovements = movements.filter(m => {
    const matchesSearch = !searchText ||
      (m.product_name && m.product_name.toLowerCase().includes(searchText.toLowerCase())) ||
      (m.product_barcode && m.product_barcode.toLowerCase().includes(searchText.toLowerCase())) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || m.movement_type === typeFilter;
    const matchesCompany = !companyFilter || m.company === companyFilter || m.company_name === companyFilter;

    return matchesSearch && matchesType && matchesCompany;
  });

  // Calculate quick metrics
  const restockIntakes = filteredMovements.filter(m => m.movement_type === 'RESTOCK');
  const totalRestockQty = restockIntakes.reduce((sum, m) => sum + (m.qty || 0), 0);
  const totalRestockValue = restockIntakes.reduce((sum, m) => sum + parseFloat(m.sub_total_price || 0), 0);

  const columns = [
    {
      title: 'Intake Date & Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <span style={{ fontWeight: 600, color: '#4a2e35' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY H:mm:ss') : 'N/A'}
        </span>
      )
    },
    {
      title: 'Movement Type',
      dataIndex: 'movement_type',
      key: 'movement_type',
      render: (t) => (
        <Tag color={t === 'RESTOCK' ? 'cyan' : t === 'SALE' ? 'pink' : 'purple'} style={{ borderRadius: 12, fontWeight: 700, padding: '2px 10px' }}>
          {t === 'RESTOCK' ? '📥 RESTOCK INTAKE' : t === 'SALE' ? '🛍️ POS SALE' : t}
        </Tag>
      )
    },
    {
      title: 'Product Item',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 700, color: '#4a2e35' }}>{name || 'Product'}</div>
          {record.product_barcode && <Tag color="pink" style={{ borderRadius: 8, fontSize: 10 }}>SKU: {record.product_barcode}</Tag>}
        </div>
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
      title: 'Intake Quantity',
      dataIndex: 'qty',
      key: 'qty',
      render: (q, record) => (
        <Tag color={record.movement_type === 'RESTOCK' ? 'success' : 'error'} style={{ borderRadius: 10, fontWeight: 800, fontSize: 13 }}>
          {record.movement_type === 'RESTOCK' ? `+${q} units` : `-${q} units`}
        </Tag>
      )
    },
    {
      title: 'Unit Cost ($)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (p) => `$${parseFloat(p || 0).toFixed(2)}`
    },
    {
      title: 'Delivery Cost ($)',
      dataIndex: 'delivery_price',
      key: 'delivery_price',
      render: (dPrice) => dPrice && parseFloat(dPrice) > 0 ? (
        <Tag color="purple" style={{ borderRadius: 8, fontWeight: 600 }}>🚚 ${parseFloat(dPrice).toFixed(2)}</Tag>
      ) : <span style={{ color: '#94a3b8' }}>$0.00</span>
    },
    {
      title: 'Total Subtotal ($)',
      dataIndex: 'sub_total_price',
      key: 'sub_total_price',
      render: (s) => <strong style={{ color: '#ff758c', fontSize: 14 }}>${parseFloat(s || 0).toFixed(2)}</strong>
    },
    {
      title: 'Supplier / Notes',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (s, record) => s || record.description || 'N/A'
    },
    {
      title: 'Logged By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (user) => <Tag color="purple" style={{ borderRadius: 8 }}>👤 {user || 'Manager'}</Tag>
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fdfbfb' }}>
      <Sidebar />
      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: 24, margin: 0 }}>

          {/* Header & Main Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, color: '#4a2e35', fontWeight: 800 }}>
                Stock Intake & Replenishment <InboxOutlined style={{ color: '#ff758c' }} />
              </h2>
              <span style={{ color: '#8c6a74', fontSize: '13px' }}>Manage incoming stock deliveries, supplier cost tracking, and inventory logs</span>
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: 10 }}>
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenNewIntake}
                style={{
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #ff758c 0%, #ff758c 100%)',
                  border: 'none', fontWeight: 700, padding: '0 20px'
                }}
              >
                New Stock Intake Entry
              </Button>
            </Space>
          </div>

          {/* Quick Metrics Banner */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, border: '1px solid #ffe3e8', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#8c6a74' }}>Total Restock Intakes</span>}
                  value={restockIntakes.length}
                  prefix={<InboxOutlined style={{ color: '#0284c7' }} />}
                  valueStyle={{ color: '#0284c7', fontWeight: 800 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, border: '1px solid #ffe3e8', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#8c6a74' }}>Total Units Restocked</span>}
                  value={totalRestockQty}
                  suffix="units"
                  prefix={<ShoppingOutlined style={{ color: '#059669' }} />}
                  valueStyle={{ color: '#059669', fontWeight: 800 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, border: '1px solid #ffe3e8', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#8c6a74' }}>Total Intake Cost Value</span>}
                  value={totalRestockValue}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: '#ff758c' }} />}
                  valueStyle={{ color: '#ff758c', fontWeight: 800 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search & Filters Bar */}
          <Card style={{ borderRadius: 16, border: '1px solid #ffe3e8', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#ff758c' }} />}
                placeholder="Search product name, barcode, or supplier..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280, borderRadius: 10 }}
                allowClear
              />

              <Select
                value={typeFilter}
                onChange={(val) => setTypeFilter(val)}
                style={{ width: 180, borderRadius: 10 }}
              >
                <Select.Option value="ALL">All Movement Types</Select.Option>
                <Select.Option value="RESTOCK">📥 Restock Intakes Only</Select.Option>
                <Select.Option value="SALE">🛍️ POS Sales Only</Select.Option>
                <Select.Option value="ADJUSTMENT">⚙️ Stock Adjustments</Select.Option>
              </Select>

              {(user?.is_superuser || role === 'Admin') && (
                <Select
                  placeholder="Filter by Store Company"
                  allowClear
                  onChange={(val) => setCompanyFilter(val)}
                  style={{ width: 220, borderRadius: 10 }}
                >
                  {companies.map(c => (
                    <Select.Option key={c.id} value={c.id}>🏬 {c.name}</Select.Option>
                  ))}
                </Select>
              )}
            </div>
          </Card>

          {/* Main Table */}
          <Card style={{ borderRadius: 16, border: '1px solid #ffe3e8' }}>
            <Table
              dataSource={filteredMovements}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>

          {/* Modal: New Stock Intake Entry */}
          <Modal
            title={<span style={{ fontWeight: 800, color: '#4a2e35' }}>📥 Record New Stock Intake</span>}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            width={650}
            style={{ borderRadius: 20 }}
          >
            <Form form={form} layout="vertical" onFinish={handleSaveIntake}>
              <Form.Item name="product_id" label="Select Product Item to Restock" rules={[{ required: true, message: 'Select a product' }]}>
                <Select
                  showSearch
                  optionLabelProp="label"
                  placeholder="Type product name, barcode or click to select..."
                  filterOption={(input, option) => (option?.searchValue || '').toLowerCase().includes(input.toLowerCase())}
                  style={{ width: '100%', borderRadius: 10 }}
                  size="large"
                >
                  {products.map(p => {
                    const searchStr = `${p.name} ${p.barcode || ''} ${p.category_name || ''} ${p.color || ''} ${p.company_name || ''}`;
                    const imgUrl = getImageUrl(p.display_image_url || p.image_url) || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400';
                    const labelText = `${p.name} (Current Stock: ${p.stock_qty} ${p.uom || 'Pcs'}${p.company_name ? ` | 🏬 ${p.company_name}` : ''})`;
                    return (
                      <Select.Option key={p.id} value={p.id} searchValue={searchStr} label={labelText}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                              src={imgUrl}
                              alt=""
                              style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ color: '#4a2e35', fontSize: 13 }}>{p.name}</strong>
                              <div style={{ fontSize: 11, color: '#8c6a74' }}>
                                SKU: {p.barcode || 'N/A'} {p.color ? `| 🎨 ${p.color}` : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {(user?.is_superuser || role === 'Admin') && p.company_name && (
                              <Tag color="blue" style={{ fontSize: 10, borderRadius: 6, margin: 0 }}>
                                🏬 {p.company_name}
                              </Tag>
                            )}
                            <Tag color={p.stock_qty <= p.min_stock_alert ? 'warning' : 'success'} style={{ borderRadius: 8, fontWeight: 700, margin: 0 }}>
                              Stock: {p.stock_qty} {p.uom || 'Pcs'}
                            </Tag>
                          </div>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="qty" label="Intake Quantity (Units Received)" rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%', borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="unit_price" label="Unit Purchase Cost ($)" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%', borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="supplier" label="Supplier Name / Wholesale Company">
                    <Input placeholder="e.g. Phnom Penh Wholesale Gift Co." style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="delivery_price" label="Delivery / Freight Cost ($)">
                    <InputNumber min={0} step={0.01} placeholder="0.00" style={{ width: '100%', borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="received_date" label="Stock Received Date">
                    <DatePicker style={{ width: '100%', borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="movement_type" label="Intake Type">
                    <Select style={{ borderRadius: 10 }}>
                      <Select.Option value="RESTOCK">📥 Restock Intake</Select.Option>
                      <Select.Option value="ADJUSTMENT">⚙️ Manual Adjustment</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="Notes / Invoice Ref">
                <Input placeholder="e.g. Received shipment batch #104" style={{ borderRadius: 10 }} />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 10 }}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitLoading}
                  style={{ borderRadius: 10, background: '#ff758c', borderColor: '#ff758c', padding: '0 24px' }}
                >
                  Save Stock Intake Entry
                </Button>
              </div>
            </Form>
          </Modal>

        </Content>
      </Layout>
    </Layout>
  );
};

export default StockIntakeScreen;
