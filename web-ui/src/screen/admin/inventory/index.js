import React, { useState, useEffect } from "react";
import { Layout, Table, Button, Card, Tooltip, Tag, Space, Input, Select, Alert, message, Avatar } from 'antd';
import Sidebar from '../../sidebar';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EditOutlined, InboxOutlined } from "@ant-design/icons";
import ModelForm from './modalform';
import api from '../../../services/api';

const { Content } = Layout;

const InventoryScreen = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [lowStockFilter, setLowStockFilter] = useState(false);

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("Add New Product");
    const [editingProduct, setEditingProduct] = useState(null);
    const [isRestock, setIsRestock] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products/');
            setProducts(res.data.results || res.data || []);
        } catch (err) {
            message.error('Failed to load inventory products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories/');
            setCategories(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setIsRestock(false);
        setModalTitle("Add New Gift Product");
        setOpenModal(true);
    };

    const handleOpenEditProduct = (product) => {
        setEditingProduct(product);
        setIsRestock(false);
        setModalTitle(`Edit Product - ${product.name}`);
        setOpenModal(true);
    };

    const handleOpenRestock = (product) => {
        setEditingProduct(product);
        setIsRestock(true);
        setModalTitle(`Stock Intake - ${product.name}`);
        setOpenModal(true);
    };

    const handleSubmitModal = async (formValues) => {
        setSubmitLoading(true);
        try {
            if (isRestock && editingProduct) {
                // Stock intake
                const subTotal = (formValues.qty || 1) * (formValues.unit_price || 0);
                await api.post('/inventory/movements/', {
                    product: editingProduct.id,
                    movement_type: 'RESTOCK',
                    qty: formValues.qty,
                    unit_price: formValues.unit_price,
                    sub_total_price: subTotal,
                    delivery_price: formValues.delivery_price || 0,
                    supplier: formValues.supplier || 'Gift Supplier',
                    description: formValues.description,
                    order_date: formValues.order_date,
                    received_date: formValues.received_date,
                });
                message.success(`Restocked ${formValues.qty} units for ${editingProduct.name}`);
            } else if (editingProduct) {
                // Update product
                await api.put(`/products/${editingProduct.id}/`, formValues);
                message.success('Product updated successfully!');
            } else {
                // Create product
                await api.post('/products/', formValues);
                message.success('New product added to inventory!');
            }
            setOpenModal(false);
            fetchProducts();
        } catch (err) {
            message.error(err.response?.data?.error || 'Operation failed');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Filtered data calculation
    const filteredProducts = products.filter(p => {
        const matchesCat = !selectedCategory || p.category === selectedCategory;
        const matchesSearch = !searchText ||
            p.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchText.toLowerCase()));
        const matchesLowStock = !lowStockFilter || p.stock_qty <= p.min_stock_alert;
        return matchesCat && matchesSearch && matchesLowStock;
    });

    const lowStockCount = products.filter(p => p.stock_qty <= p.min_stock_alert).length;

    const columns = [
        {
            title: 'No',
            dataIndex: 'index',
            width: 60,
            render: (_, __, index) => index + 1
        },
        {
            title: 'Image',
            dataIndex: 'image_url',
            width: 70,
            render: (url, record) => (
                <Avatar
                    shape="square"
                    size={42}
                    src={url || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400'}
                    style={{ borderRadius: '10px' }}
                />
            )
        },
        {
            title: 'Barcode SKU',
            dataIndex: 'barcode',
            key: 'barcode',
            render: (code) => <Tag color="pink">{code || 'N/A'}</Tag>
        },
        {
            title: 'Product Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong style={{ color: '#4a2e35' }}>{text}</strong>
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (cat) => <Tag color="purple">{cat || 'General'}</Tag>
        },
        {
            title: 'Stock Level',
            dataIndex: 'stock_qty',
            key: 'stock_qty',
            render: (qty, record) => {
                const isLow = qty <= record.min_stock_alert;
                const isOut = qty === 0;
                return (
                    <Tag color={isOut ? 'error' : isLow ? 'warning' : 'success'} style={{ borderRadius: '12px', fontWeight: 700 }}>
                        {isOut ? 'Out of stock (0)' : isLow ? `Low Stock (${qty})` : `In Stock (${qty})`}
                    </Tag>
                );
            }
        },
        {
            title: 'Price ($)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => <span style={{ fontWeight: 700, color: '#ff758c' }}>${parseFloat(price).toFixed(2)}</span>
        },
        {
            title: 'Cost ($)',
            dataIndex: 'cost',
            key: 'cost',
            render: (cost) => <span>${parseFloat(cost || 0).toFixed(2)}</span>
        },
        {
            title: 'Actions',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Stock Intake / Restock">
                        <Button
                            size="small"
                            type="primary"
                            icon={<InboxOutlined />}
                            onClick={() => handleOpenRestock(record)}
                            style={{ background: '#38bdf8', border: 'none', borderRadius: '8px' }}
                        />
                    </Tooltip>
                    <Tooltip title="Edit Details">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditProduct(record)}
                            style={{ borderRadius: '8px' }}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#fdfbfb' }}>
            <Sidebar />
            <Layout style={{ background: 'transparent' }}>
                <Content style={{ padding: 24, margin: 0 }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#4a2e35', fontWeight: 800 }}>Inventory & Stock Management</h2>
                            <span style={{ color: '#8c6a74', fontSize: '13px' }}>Monitor product stock levels, categories, and replenishment</span>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleOpenAddProduct}
                            className="btn-girly"
                            style={{ height: '40px', padding: '0 20px' }}
                        >
                            Add New Product
                        </Button>
                    </div>

                    {lowStockCount > 0 && (
                        <Alert
                            message={`Low Stock Warning: ${lowStockCount} item(s) are at or below their alert threshold.`}
                            type="warning"
                            showIcon
                            action={
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => setLowStockFilter(!lowStockFilter)}
                                >
                                    {lowStockFilter ? "Show All Items" : "View Low Stock Only"}
                                </Button>
                            }
                            style={{ marginBottom: '16px', borderRadius: '14px' }}
                        />
                    )}

                    <Card className="glass-card">
                        {/* Search and Filters */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <Space wrap>
                                <Input
                                    prefix={<SearchOutlined style={{ color: '#ff758c' }} />}
                                    placeholder="Search product or barcode..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: 240, borderRadius: '16px' }}
                                />
                                <Select
                                    placeholder="Filter by Category"
                                    allowClear
                                    style={{ width: 180, borderRadius: '16px' }}
                                    onChange={(val) => setSelectedCategory(val)}
                                >
                                    {categories.map(c => (
                                        <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                    ))}
                                </Select>
                            </Space>
                            <Tooltip title="Refresh Table">
                                <Button icon={<ReloadOutlined />} onClick={fetchProducts} style={{ borderRadius: '16px' }} />
                            </Tooltip>
                        </div>

                        <Table
                            loading={loading}
                            columns={columns}
                            dataSource={filteredProducts}
                            rowKey="id"
                            pagination={{ pageSize: 8 }}
                        />
                    </Card>

                    <ModelForm
                        title={modalTitle}
                        loading={submitLoading}
                        open={openModal}
                        categories={categories}
                        isRestock={isRestock}
                        initialValues={editingProduct}
                        onSubmit={handleSubmitModal}
                        onCancel={() => setOpenModal(false)}
                    />
                </Content>
            </Layout>
        </Layout>
    );
};

export default InventoryScreen;
