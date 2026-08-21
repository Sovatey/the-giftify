import React, { useState, useEffect } from 'react';
import {
  Layout, Row, Col, Card, Input, Button, Tag, Badge, Divider,
  Modal, Radio, InputNumber, message, Empty, Spin, Tooltip, Image, ConfigProvider
} from 'antd';
import {
  SearchOutlined, ShoppingCartOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined, PrinterOutlined, CheckCircleOutlined,
  QrcodeOutlined, CreditCardOutlined, DollarOutlined, ReloadOutlined,
  HeartOutlined, EyeOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import Sidebar from '../sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { Content } = Layout;

const POSScreen = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Modal states
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Product detail modal state
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailQty, setDetailQty] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/'),
        api.get('/products/categories/')
      ]);
      setProducts(prodRes.data.results || prodRes.data || []);
      setCategories(catRes.data.results || catRes.data || []);
    } catch (err) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory || p.category_name === selectedCategory;
    const matchesSearch = !searchText ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchText.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Open item detail modal
  const handleViewDetail = (product) => {
    setSelectedProductDetail(product);
    setDetailQty(1);
    setIsDetailModalOpen(true);
  };

  // Cart operations
  const addToCart = (product, addQty = 1) => {
    if (product.stock_qty <= 0) {
      message.warning(`${product.name} is currently out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.qty + addQty > product.stock_qty) {
          message.warning(`Max stock reached for ${product.name} (Available: ${product.stock_qty})`);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id ? { ...item, qty: item.qty + addQty } : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        maxStock: product.stock_qty,
        qty: addQty,
        image_url: product.image_url
      }];
    });
    message.success(`Added ${product.name} to cart!`);
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            message.warning(`Cannot exceed available stock (${item.maxStock})`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const changeDue = Math.max(0, amountPaid - grandTotal);

  // POS Checkout trigger
  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (paymentMethod === 'CASH' && amountPaid < grandTotal) {
      message.warning(`Amount paid ($${amountPaid.toFixed(2)}) is less than grand total ($${grandTotal.toFixed(2)})`);
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        cashier_name: user?.name || user?.username || 'Cashier',
        items: cart,
        discount_amount: discount,
        tax_amount: 0,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'CASH' ? amountPaid : grandTotal
      };

      const res = await api.post('/sales/checkout/', payload);
      setLastReceipt(res.data);
      setIsReceiptModalOpen(true);
      setCart([]);
      setDiscount(0);
      setAmountPaid(0);
      fetchInitialData(); // Refresh product stock levels
      message.success('Sale transaction completed!');
    } catch (err) {
      message.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ff758c',
          borderRadius: 12,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#fdfbfb' }}>
        <Sidebar />
        <Layout style={{ background: 'transparent' }}>
          <Content style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            
            <Row gutter={16} style={{ height: '100%' }}>
              {/* Left Column - Product Catalog */}
              <Col xs={24} lg={15} xl={16} style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '12px' }}>
                
                {/* Header Search & Controls */}
                <Card className="glass-card" style={{ marginBottom: '16px', padding: '12px' }}>
                  <Row align="middle" justify="space-between" gutter={[12, 12]}>
                    <Col xs={24} sm={14}>
                      <Input
                        prefix={<SearchOutlined style={{ color: '#ff758c' }} />}
                        placeholder="Search gift name or scan barcode..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        style={{ borderRadius: '20px', fontSize: '15px' }}
                      />
                    </Col>
                    <Col xs={24} sm={10} style={{ textAlign: 'right' }}>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchInitialData}
                        style={{ borderRadius: '20px', fontWeight: 600 }}
                      >
                        Refresh Stock
                      </Button>
                    </Col>
                  </Row>

                  {/* Category Pills */}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <Tag
                      color={selectedCategory === 'ALL' ? '#ff758c' : 'default'}
                      onClick={() => setSelectedCategory('ALL')}
                      style={{
                        cursor: 'pointer', borderRadius: '16px', padding: '6px 16px',
                        fontWeight: 700, fontSize: '13px', border: 'none'
                      }}
                    >
                      All Gifts
                    </Tag>
                    {categories.map(cat => (
                      <Tag
                        key={cat.id}
                        color={selectedCategory === cat.name || selectedCategory === cat.id ? '#ff758c' : 'default'}
                        onClick={() => setSelectedCategory(cat.name)}
                        style={{
                          cursor: 'pointer', borderRadius: '16px', padding: '6px 16px',
                          fontWeight: 700, fontSize: '13px', border: 'none'
                        }}
                      >
                        {cat.name}
                      </Tag>
                    ))}
                  </div>
                </Card>

                {/* Product Grid */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', paddingTop: '80px' }}><Spin size="large" /></div>
                  ) : filteredProducts.length === 0 ? (
                    <Empty description="No gifts found" style={{ marginTop: '60px' }} />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {filteredProducts.map(product => (
                        <Col xs={12} sm={8} md={6} key={product.id}>
                          <Card
                            hoverable
                            className="glass-card"
                            onClick={() => handleViewDetail(product)} // Clicking card opens Detail Modal
                            cover={
                              <div style={{ height: '130px', overflow: 'hidden', borderRadius: '16px 16px 0 0', position: 'relative' }}>
                                <img
                                  alt={product.name}
                                  src={product.image_url || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Tag
                                  color={product.stock_qty > 5 ? 'success' : product.stock_qty > 0 ? 'warning' : 'error'}
                                  style={{ position: 'absolute', top: '8px', right: '8px', borderRadius: '10px', fontWeight: 700 }}
                                >
                                  {product.stock_qty > 0 ? `Stock: ${product.stock_qty}` : 'Out of stock'}
                                </Tag>
                                <div
                                  style={{
                                    position: 'absolute', bottom: '6px', left: '6px',
                                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                                    padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600
                                  }}
                                >
                                  <EyeOutlined /> Details
                                </div>
                              </div>
                            }
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#4a2e35', height: '38px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {product.name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ff758c' }}>
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                              
                              {/* ONLY clicking this + button adds directly to cart */}
                              <Tooltip title="Add to cart">
                                <Button
                                  type="primary"
                                  shape="circle"
                                  size="middle"
                                  icon={<PlusOutlined />}
                                  disabled={product.stock_qty <= 0}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevents opening detail modal
                                    addToCart(product, 1);
                                  }}
                                  style={{
                                    background: 'linear-gradient(135deg, #ffaead, #ff758c)',
                                    border: 'none',
                                    boxShadow: '0 4px 10px rgba(255,117,140,0.4)'
                                  }}
                                />
                              </Tooltip>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Col>

              {/* Right Column - POS Cart & Payment Sidebar */}
              <Col xs={24} lg={9} xl={8} style={{ height: '100%' }}>
                <Card className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px' }}>
                  
                  {/* Cart Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#4a2e35' }}>
                      <ShoppingCartOutlined style={{ color: '#ff758c', marginRight: '8px' }} /> Current Cart
                    </span>
                    <Badge count={cart.reduce((s, i) => s + i.qty, 0)} overflowCount={99} style={{ backgroundColor: '#ff758c' }} />
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Cart Items List */}
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
                    {cart.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#8c6a74', marginTop: '60px' }}>
                        <ShoppingCartOutlined style={{ fontSize: '40px', color: '#ffaead', marginBottom: '8px' }} />
                        <div>Your cart is empty</div>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div
                          key={item.product_id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                            background: 'rgba(255, 240, 243, 0.6)', borderRadius: '12px', marginBottom: '8px'
                          }}
                        >
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400'}
                            alt={item.name}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#4a2e35' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#ff758c', fontWeight: 700 }}>
                              ${item.price.toFixed(2)} x {item.qty} = ${(item.price * item.qty).toFixed(2)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Button size="small" shape="circle" icon={<MinusOutlined />} onClick={() => updateCartQty(item.product_id, -1)} />
                            <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                            <Button size="small" shape="circle" icon={<PlusOutlined />} onClick={() => updateCartQty(item.product_id, 1)} />
                            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.product_id)} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Calculation Summary */}
                  <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#4a2e35' }}>Subtotal:</span>
                      <strong style={{ color: '#4a2e35', fontSize: '15px' }}>${subtotal.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#4a2e35' }}>Discount ($):</span>
                      <InputNumber
                        min={0}
                        max={subtotal}
                        size="small"
                        value={discount}
                        onChange={(v) => setDiscount(v || 0)}
                        style={{ width: '90px', borderRadius: '8px' }}
                      />
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '20px', fontWeight: 800, color: '#ff758c' }}>
                      <span>Grand Total:</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Selection */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#8c6a74', marginBottom: '8px', letterSpacing: '0.5px' }}>PAYMENT METHOD</div>
                    <Radio.Group
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      buttonStyle="solid"
                      style={{ width: '100%', display: 'flex' }}
                    >
                      <Radio.Button value="CASH" style={{ flex: 1, textAlign: 'center', borderRadius: '10px 0 0 10px', fontWeight: 600 }}>
                        <DollarOutlined /> Cash
                      </Radio.Button>
                      <Radio.Button value="KHQR" style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
                        <QrcodeOutlined /> KHQR
                      </Radio.Button>
                      <Radio.Button value="CARD" style={{ flex: 1, textAlign: 'center', borderRadius: '0 10px 10px 0', fontWeight: 600 }}>
                        <CreditCardOutlined /> Card
                      </Radio.Button>
                    </Radio.Group>

                    {paymentMethod === 'CASH' && (
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4a2e35', whiteSpace: 'nowrap' }}>Amount Paid ($):</span>
                        <InputNumber
                          min={0}
                          step={1}
                          value={amountPaid}
                          onChange={(v) => setAmountPaid(v || 0)}
                          style={{ flex: 1, borderRadius: '8px' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: changeDue >= 0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                          Change: ${changeDue.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Checkout Action Button */}
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={checkoutLoading}
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="btn-girly"
                    style={{ height: '48px', fontSize: '16px' }}
                  >
                    Pay & Complete Sale (${grandTotal.toFixed(2)})
                  </Button>

                </Card>
              </Col>
            </Row>

          {/* ITEM DETAIL MODAL */}
          <Modal
            open={isDetailModalOpen}
            onCancel={() => setIsDetailModalOpen(false)}
            footer={null}
            width={650}
            style={{ borderRadius: '24px', overflow: 'hidden' }}
          >
            {selectedProductDetail && (
              <Row gutter={[20, 20]} style={{ padding: '8px' }}>
                <Col xs={24} md={10}>
                  <div style={{ borderRadius: '16px', overflow: 'hidden', height: '230px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <Image
                      src={selectedProductDetail.image_url || 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400'}
                      alt={selectedProductDetail.name}
                      style={{ width: '100%', height: '230px', objectFit: 'cover' }}
                    />
                  </div>
                </Col>

                <Col xs={24} md={14} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Tag color="purple" style={{ borderRadius: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      {selectedProductDetail.category_name || 'General Gift'}
                    </Tag>
                    <Tag color="pink" style={{ borderRadius: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      SKU: {selectedProductDetail.barcode || 'N/A'}
                    </Tag>

                    <h2 style={{ color: '#4a2e35', fontWeight: 800, margin: '4px 0 8px 0', fontSize: '20px' }}>
                      {selectedProductDetail.name}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 800, color: '#ff758c' }}>
                        ${parseFloat(selectedProductDetail.price).toFixed(2)}
                      </span>
                      {selectedProductDetail.cost && (
                        <span style={{ fontSize: '13px', color: '#8c6a74', textDecoration: 'line-through' }}>
                          Cost: ${parseFloat(selectedProductDetail.cost).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <Tag
                        color={selectedProductDetail.stock_qty > 5 ? 'success' : selectedProductDetail.stock_qty > 0 ? 'warning' : 'error'}
                        style={{ borderRadius: '12px', padding: '4px 12px', fontWeight: 700, fontSize: '13px' }}
                      >
                        {selectedProductDetail.stock_qty > 0
                          ? `Available Stock: ${selectedProductDetail.stock_qty} units`
                          : 'Out of Stock'}
                      </Tag>
                    </div>

                    <p style={{ color: '#555', fontSize: '13px', lineHeight: '1.5', background: 'rgba(255,240,243,0.6)', padding: '10px', borderRadius: '12px' }}>
                      <InfoCircleOutlined style={{ color: '#ff758c', marginRight: '6px' }} />
                      {selectedProductDetail.description || 'Premium gift item crafted for Special occasions with high quality standards.'}
                    </p>
                  </div>

                  {/* Quantity & Add to Cart inside Detail Modal */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                    <InputNumber
                      min={1}
                      max={selectedProductDetail.stock_qty || 1}
                      value={detailQty}
                      onChange={(v) => setDetailQty(v || 1)}
                      style={{ width: '80px', borderRadius: '12px' }}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={selectedProductDetail.stock_qty <= 0}
                      onClick={() => {
                        addToCart(selectedProductDetail, detailQty);
                        setIsDetailModalOpen(false);
                      }}
                      className="btn-girly"
                      style={{ flex: 1, height: '40px', fontSize: '15px' }}
                    >
                      Add to Cart (${(parseFloat(selectedProductDetail.price) * detailQty).toFixed(2)})
                    </Button>
                  </div>
                </Col>
              </Row>
            )}
          </Modal>

          {/* Printable Receipt Modal */}
          <Modal
            open={isReceiptModalOpen}
            onCancel={() => setIsReceiptModalOpen(false)}
            footer={[
              <Button key="close" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>,
              <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} className="btn-girly">
                Print Receipt
              </Button>
            ]}
          >
            {lastReceipt && (
              <div id="printable-receipt" style={{ padding: '16px', fontFamily: 'monospace', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>The Giftify POS</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Cute Gifts & Accessories</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Phnom Penh, Cambodia</div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ textAlign: 'left', fontSize: '12px' }}>
                  <div><strong>Invoice:</strong> {lastReceipt.invoice_no}</div>
                  <div><strong>Cashier:</strong> {lastReceipt.cashier_name}</div>
                  <div><strong>Date:</strong> {new Date(lastReceipt.created_at).toLocaleString()}</div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastReceipt.items?.map(it => (
                      <tr key={it.id}>
                        <td>{it.product_name}</td>
                        <td>{it.qty}</td>
                        <td>${parseFloat(it.unit_price).toFixed(2)}</td>
                        <td>${parseFloat(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <div>Subtotal: ${parseFloat(lastReceipt.subtotal).toFixed(2)}</div>
                  <div>Discount: -${parseFloat(lastReceipt.discount_amount).toFixed(2)}</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '4px' }}>
                    Grand Total: ${parseFloat(lastReceipt.grand_total).toFixed(2)}
                  </div>
                  <div>Payment Method: {lastReceipt.payment_method}</div>
                  <div>Paid: ${parseFloat(lastReceipt.amount_received).toFixed(2)}</div>
                  <div>Change: ${parseFloat(lastReceipt.change_given).toFixed(2)}</div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '12px', fontStyle: 'italic' }}>Thank you for shopping at The Giftify! <HeartOutlined /></div>
              </div>
            )}
          </Modal>

        </Content>
      </Layout>
    </Layout>
    </ConfigProvider>
  );
};

export default POSScreen;
