import React, { useState, useEffect } from "react";
import { Layout, Table, Button, Card, Tooltip, Tag, Space, Input, Select, Alert, message, Avatar, Modal } from 'antd';
import Sidebar from '../../sidebar';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EditOutlined, InboxOutlined, CopyOutlined, HistoryOutlined } from "@ant-design/icons";
import ModelForm from './modalform';
import api from '../../../services/api';

import { renderCategoryIcon } from '../../../utils/categoryIcon';
import { getImageUrl } from '../../../utils/imageUrl';
import { useAuth } from '../../../context/AuthContext';
import dayjs from 'dayjs';

const { Content } = Layout;

const InventoryScreen = () => {
    const { user, role } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(null);
    const [lowStockFilter, setLowStockFilter] = useState(false);

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("Add New Product");
    const [editingProduct, setEditingProduct] = useState(null);
    const [duplicateValues, setDuplicateValues] = useState(null);
    const [isRestock, setIsRestock] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Stock Movement Audit History Modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [stockMovements, setStockMovements] = useState([]);
    const [movementsLoading, setMovementsLoading] = useState(false);

    const fetchStockMovements = async () => {
        setMovementsLoading(true);
        try {
            const res = await api.get('/inventory/stock-movements/');
            setStockMovements(res.data.results || res.data || []);
        } catch (err) {
            message.error('Failed to load stock movements');
        } finally {
            setMovementsLoading(false);
        }
    };

    const handleOpenHistoryModal = () => {
        fetchStockMovements();
        setIsHistoryModalOpen(true);
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        if (user?.is_superuser || role === 'Admin') {
            api.get('/user/companies/').then(res => {
                setCompanies(res.data.results || res.data || []);
            }).catch(() => {});
        }
    }, [user, role]);

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
        setDuplicateValues(null);
        setIsRestock(false);
        setModalTitle("Add New Gift Product");
        setOpenModal(true);
    };

    const handleOpenEditProduct = (product) => {
        setEditingProduct(product);
        setDuplicateValues(null);
        setIsRestock(false);
        setModalTitle(`Edit Product - ${product.name}`);
        setOpenModal(true);
    };

    const handleDuplicateProduct = (product) => {
        setEditingProduct(null);
        setDuplicateValues({
            ...product,
            id: undefined,
            name: `${product.name} (Copy)`,
            barcode: product.barcode ? `${product.barcode}-COPY` : '',
        });
        setIsRestock(false);
        setModalTitle(`Duplicate Product - ${product.name}`);
        setOpenModal(true);
    };

    const handleOpenRestock = (product) => {
        setEditingProduct(product);
        setDuplicateValues(null);
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
            } else {
                const formData = new FormData();
                Object.keys(formValues).forEach(key => {
                    if (formValues[key] !== undefined && formValues[key] !== null) {
                        formData.append(key, formValues[key]);
                    }
                });

                const config = { headers: { 'Content-Type': 'multipart/form-data' } };

                if (editingProduct) {
                    await api.put(`/products/${editingProduct.id}/`, formData, config);
                    message.success('Product updated successfully!');
                } else {
                    await api.post('/products/', formData, config);
                    message.success('New product added to inventory!');
                }
            }
            setOpenModal(false);
            fetchProducts();
        } catch (err) {
            console.error(err);
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
        const matchesCompany = !selectedCompanyFilter || p.company === selectedCompanyFilter || p.company_name === selectedCompanyFilter;
        return matchesCat && matchesSearch && matchesLowStock && matchesCompany;
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
            dataIndex: 'display_image_url',
            width: 70,
            render: (url, record) => (
                <Avatar
                    shape="square"
                    size={42}
                    src={getImageUrl(url || record.image_url) || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400'}
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
            title: 'Store Company',
            dataIndex: 'company_name',
            key: 'company_name',
            render: (cName) => (
                <Tag color="blue" style={{ borderRadius: '10px', fontWeight: 700 }}>
                    🏬 {cName || 'The Giftify'}
                </Tag>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (cat, record) => (
                <Tag color="purple" style={{ borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {renderCategoryIcon(record.category_icon, 13)} {cat || 'General'}
                </Tag>
            )
        },
        {
            title: 'Variant & UOM',
            key: 'variants',
            render: (_, record) => (
                <Space size={4} wrap>
                    <Tag color="cyan" style={{ borderRadius: '10px', fontWeight: 700 }}>
                        {record.uom || 'Pcs'}
                    </Tag>
                    {record.color && (
                        <Tag color="magenta" style={{ borderRadius: '10px', fontWeight: 600 }}>
                            🎨 {record.color}
                        </Tag>
                    )}
                    {record.size && (
                        <Tag color="orange" style={{ borderRadius: '10px', fontWeight: 600 }}>
                            📐 {record.size}
                        </Tag>
                    )}
                </Space>
            )
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
                    <Tooltip title="Duplicate / Copy Item to Create Variant">
                        <Button
                            size="small"
                            icon={<CopyOutlined style={{ color: '#c084fc' }} />}
                            onClick={() => handleDuplicateProduct(record)}
                            style={{ borderRadius: '8px', borderColor: '#e9d5ff' }}
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
                        <Space>
                            <Button
                                icon={<HistoryOutlined />}
                                onClick={handleOpenHistoryModal}
                                loading={movementsLoading}
                                style={{ borderRadius: '10px', borderColor: '#38bdf8', color: '#0284c7', fontWeight: 600 }}
                            >
                                Intake History Log
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading} style={{ borderRadius: '10px' }}>
                                Refresh
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleOpenAddProduct}
                                style={{
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #ff758c 0%, #ff758c 100%)',
                                    border: 'none', fontWeight: 700
                                }}
                            >
                                Add Product
                            </Button>
                        </Space>
                    </div>

                    {lowStockCount > 0 && (
                        <Alert
                            message={`Attention: ${lowStockCount} item(s) are at or below low-stock threshold!`}
                            type="warning"
                            showIcon
                            style={{ marginBottom: '16px', borderRadius: '12px' }}
                        />
                    )}

                    <Card style={{ borderRadius: '16px', border: '1px solid #ffe3e8' }}>
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#ff758c' }} />}
                                placeholder="Search product name or barcode..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 260, borderRadius: '10px' }}
                                allowClear
                            />
                            {(user?.is_superuser || role === 'Admin') && (
                                <Select
                                    placeholder="Filter by Company"
                                    allowClear
                                    onChange={(val) => setSelectedCompanyFilter(val)}
                                    style={{ width: 180 }}
                                >
                                    {companies.map(c => (
                                        <Select.Option key={c.id} value={c.id}>🏬 {c.name}</Select.Option>
                                    ))}
                                </Select>
                            )}
                            <Select
                                placeholder="Filter by category"
                                allowClear
                                onChange={(val) => setSelectedCategory(val)}
                                style={{ width: 180 }}
                            >
                                {categories.map(c => (
                                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                ))}
                            </Select>
                            <Button
                                type={lowStockFilter ? "primary" : "default"}
                                danger={lowStockFilter}
                                onClick={() => setLowStockFilter(!lowStockFilter)}
                                style={{ borderRadius: '10px' }}
                            >
                                {lowStockFilter ? "Show All Stock" : "Low Stock Alert Only"}
                            </Button>
                        </div>

                        <Table
                            dataSource={filteredProducts}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 8 }}
                        />
                    </Card>

                    <ModelForm
                        title={modalTitle}
                        loading={submitLoading}
                        open={openModal}
                        categories={categories}
                        isRestock={isRestock}
                        initialValues={editingProduct || duplicateValues}
                        onSubmit={handleSubmitModal}
                        onCancel={() => setOpenModal(false)}
                    />

                    {/* Stock Movement & Intake Audit Log Modal */}
                    <Modal
                        title={<span style={{ fontWeight: 800, color: '#4a2e35' }}>📥 Stock Intake & Movement History Audit</span>}
                        open={isHistoryModalOpen}
                        onCancel={() => setIsHistoryModalOpen(false)}
                        footer={null}
                        width={900}
                        style={{ borderRadius: 20 }}
                    >
                        <Table
                            dataSource={stockMovements}
                            loading={movementsLoading}
                            rowKey="id"
                            pagination={{ pageSize: 8 }}
                            columns={[
                                {
                                    title: 'Date & Time',
                                    dataIndex: 'created_at',
                                    key: 'created_at',
                                    render: (d) => d ? dayjs(d).format('DD-MMM-YYYY H:mm:ss') : 'N/A'
                                },
                                {
                                    title: 'Movement Type',
                                    dataIndex: 'movement_type',
                                    key: 'movement_type',
                                    render: (t) => (
                                        <Tag color={t === 'RESTOCK' ? 'cyan' : t === 'SALE' ? 'pink' : 'purple'} style={{ borderRadius: 10, fontWeight: 700 }}>
                                            {t === 'RESTOCK' ? '📥 RESTOCK INTAKE' : t === 'SALE' ? '🛍️ POS SALE' : t}
                                        </Tag>
                                    )
                                },
                                {
                                    title: 'Product',
                                    dataIndex: 'product_name',
                                    key: 'product_name',
                                    render: (name) => <strong style={{ color: '#4a2e35' }}>{name}</strong>
                                },
                                {
                                    title: 'Store Company',
                                    dataIndex: 'company_name',
                                    key: 'company_name',
                                    render: (cName) => <Tag color="blue" style={{ borderRadius: 10 }}>🏬 {cName || 'The Giftify'}</Tag>
                                },
                                {
                                    title: 'Quantity',
                                    dataIndex: 'qty',
                                    key: 'qty',
                                    render: (q, r) => (
                                        <strong style={{ color: r.movement_type === 'RESTOCK' ? '#059669' : '#dc2626' }}>
                                            {r.movement_type === 'RESTOCK' ? `+${q}` : `-${q}`}
                                        </strong>
                                    )
                                },
                                {
                                    title: 'Unit Cost',
                                    dataIndex: 'unit_price',
                                    key: 'unit_price',
                                    render: (p) => `$${parseFloat(p || 0).toFixed(2)}`
                                },
                                {
                                    title: 'Subtotal Value',
                                    dataIndex: 'sub_total_price',
                                    key: 'sub_total_price',
                                    render: (s) => <strong style={{ color: '#ff758c' }}>${parseFloat(s || 0).toFixed(2)}</strong>
                                },
                                {
                                    title: 'Handled By',
                                    dataIndex: 'created_by',
                                    key: 'created_by',
                                    render: (u) => u || 'System'
                                }
                            ]}
                        />
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default InventoryScreen;
