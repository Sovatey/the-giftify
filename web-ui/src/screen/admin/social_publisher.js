import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Tabs, Button, Form, Input, Select, TimePicker, DatePicker,
  Checkbox, Table, Tag, Space, Modal, Switch, Row, Col, Statistic, Tooltip,
  message, Popconfirm, Upload, Badge, Calendar, Divider
} from 'antd';
import {
  FacebookOutlined, SendOutlined, ClockCircleOutlined, SyncOutlined,
  PlusOutlined, SettingOutlined, HistoryOutlined, ShoppingOutlined,
  ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, DeleteOutlined, EditOutlined, ShareAltOutlined,
  UploadOutlined, VideoCameraOutlined, PictureOutlined, KeyOutlined,
  CalendarOutlined, FireOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Sidebar from '../sidebar';
import api from '../../services/api';

const { Content } = Layout;
const { TextArea } = Input;

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'MON', color: '#ff758c' },
  { label: 'Tuesday', value: 'TUE', color: '#ff9068' },
  { label: 'Wednesday', value: 'WED', color: '#4eb6ac' },
  { label: 'Thursday', value: 'THU', color: '#42a5f5' },
  { label: 'Friday', value: 'FRI', color: '#ab47bc' },
  { label: 'Saturday', value: 'SAT', color: '#ec407a' },
  { label: 'Sunday', value: 'SUN', color: '#ffa726' }
];

// PKCE Helper Functions for TikTok OAuth 2.0
const generateRandomString = (length = 40) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const SocialPublisherScreen = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);

  // File Upload state
  const [imageFileList, setImageFileList] = useState([]);
  const [videoFileList, setVideoFileList] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modals & Form states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [testingAccountId, setTestingAccountId] = useState(null);
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);

  const [postForm] = Form.useForm();
  const [accountForm] = Form.useForm();

  // Handle TikTok OAuth Redirect Code Exchange on Page Load
  const handleTikTokCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const codeVerifier = sessionStorage.getItem('tiktok_code_verifier');
      if (codeVerifier) {
        setIsConnectingTikTok(true);
        message.loading({ content: 'Authenticating with TikTok...', key: 'tiktok_auth' });
        try {
          const redirectUri = (window.location.origin + window.location.pathname).replace('localhost', '127.0.0.1');
          const res = await api.post('/social/accounts/tiktok-token-exchange/', {
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri
          });

          if (res.data.success) {
            message.success({ content: 'TikTok account connected successfully! 🚀', key: 'tiktok_auth' });
            sessionStorage.removeItem('tiktok_code_verifier');
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchData();
          } else {
            message.error({ content: res.data.message || 'TikTok auth failed', key: 'tiktok_auth' });
          }
        } catch (err) {
          console.error(err);
          message.error({ content: err.response?.data?.message || 'TikTok token exchange failed', key: 'tiktok_auth' });
        } finally {
          setIsConnectingTikTok(false);
        }
      }
    }
  };

  // Launch TikTok 1-Click OAuth Authorization with PKCE
  const startTikTokOAuth = async (clientKey) => {
    if (!clientKey) {
      message.error('Please enter your TikTok Client Key first!');
      return;
    }
    try {
      const codeVerifier = generateRandomString(50);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      sessionStorage.setItem('tiktok_code_verifier', codeVerifier);

      const currentHost = window.location.origin.replace('localhost', '127.0.0.1');
      const redirectUri = encodeURIComponent(currentHost + window.location.pathname);
      const scope = encodeURIComponent('user.info.basic,video.publish,video.upload');

      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      window.location.href = authUrl;
    } catch (err) {
      console.error(err);
      message.error('Failed to initiate TikTok login');
    }
  };

  // Load all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, accountsRes, logsRes] = await Promise.all([
        api.get('/social/posts/'),
        api.get('/social/accounts/'),
        api.get('/social/logs/')
      ]);
      setPosts(postsRes.data);
      setAccounts(accountsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load social publisher data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/products/');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
    handleTikTokCallback();
  }, []);

  // Post Submission Handler
  const handleSavePost = async (values) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('schedule_type', values.schedule_type);
      formData.append('is_active', values.is_active !== undefined ? values.is_active : true);
      formData.append('fb_post_type', values.fb_post_type || 'FEED');
      formData.append('tiktok_post_type', values.tiktok_post_type || 'PHOTO_CAROUSEL');
      formData.append('telegram_post_type', values.telegram_post_type || 'PHOTO');

      const platformsArr = values.platforms || [];
      formData.append('platforms', JSON.stringify(platformsArr));

      const recurringDaysArr = values.recurring_days || [];
      formData.append('recurring_days', JSON.stringify(recurringDaysArr));

      if (values.image_url) formData.append('image_url', values.image_url);
      if (values.video_url) formData.append('video_url', values.video_url);

      imageFileList.forEach((fileItem) => {
        if (fileItem.originFileObj) {
          formData.append('image_files', fileItem.originFileObj);
        }
      });

      videoFileList.forEach((fileItem) => {
        if (fileItem.originFileObj) {
          formData.append('video_files', fileItem.originFileObj);
        }
      });

      if (values.schedule_type === 'ONE_TIME' && values.scheduled_at) {
        formData.append('scheduled_at', values.scheduled_at.format('YYYY-MM-DD HH:mm:ss'));
      }

      if ((values.schedule_type === 'DAILY_RECURRING' || values.schedule_type === 'WEEKLY_RECURRING') && values.daily_time) {
        formData.append('daily_time', values.daily_time.format('HH:mm:ss'));
      }

      const headers = { 'Content-Type': 'multipart/form-data' };

      if (editingPost) {
        await api.put(`/social/posts/${editingPost.id}/`, formData, { headers });
        message.success('Post schedule updated');
      } else {
        await api.post('/social/posts/', formData, { headers });
        message.success(
          values.schedule_type === 'IMMEDIATE'
            ? 'Post published immediately!'
            : 'Scheduled auto-post created successfully'
        );
      }

      setIsPostModalOpen(false);
      postForm.resetFields();
      setImageFileList([]);
      setVideoFileList([]);
      setSelectedProductIds([]);
      setEditingPost(null);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Failed to save post');
    }
  };

  // Immediate Publish Now Button
  const handlePublishNow = async (postId) => {
    try {
      message.loading({ content: 'Publishing across selected platforms...', key: 'publish' });
      const res = await api.post(`/social/posts/${postId}/publish-now/`);
      if (res.data.success) {
        message.success({ content: 'Published successfully!', key: 'publish' });
      } else {
        message.warning({ content: 'Publishing completed with warnings.', key: 'publish' });
      }
      fetchData();
    } catch (err) {
      console.error(err);
      message.error({ content: 'Failed to trigger immediate publishing', key: 'publish' });
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/social/posts/${postId}/`);
      message.success('Post schedule deleted');
      fetchData();
    } catch (err) {
      message.error('Failed to delete post');
    }
  };

  // Toggle Post Active State
  const handleToggleActive = async (post, activeState) => {
    try {
      await api.put(`/social/posts/${post.id}/`, { ...post, is_active: activeState });
      message.success(activeState ? 'Auto-posting activated' : 'Auto-posting paused');
      fetchData();
    } catch (err) {
      message.error('Failed to toggle post state');
    }
  };

  // Account Submission Handler
  const handleSaveAccount = async (values) => {
    try {
      if (editingAccount) {
        await api.put(`/social/accounts/${editingAccount.id}/`, values);
        message.success('Social account updated');
      } else {
        await api.post('/social/accounts/', values);
        message.success('Social account connected');
      }
      setIsAccountModalOpen(false);
      accountForm.resetFields();
      setEditingAccount(null);
      fetchData();
    } catch (err) {
      message.error('Failed to save account');
    }
  };

  // Test Connection
  const handleTestConnection = async (accountId) => {
    setTestingAccountId(accountId);
    try {
      const res = await api.post(`/social/accounts/${accountId}/test-connection/`);
      if (res.data.success) {
        message.success(res.data.message || 'Connection test successful!');
      } else {
        message.error(res.data.message || 'Connection test failed');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingAccountId(null);
    }
  };

  // Toggle Selection of Multiple Products from Store Inventory
  const handleToggleProductSelection = (prod) => {
    const prodId = prod.id || prod.code;
    let newSelected = [...selectedProductIds];
    if (newSelected.includes(prodId)) {
      newSelected = newSelected.filter(id => id !== prodId);
    } else {
      newSelected.push(prodId);
    }
    setSelectedProductIds(newSelected);
  };

  // Confirm Multi-Product Selection
  const handleConfirmProductSelection = () => {
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id || p.code));
    if (selectedProds.length === 0) {
      setIsProductPickerOpen(false);
      return;
    }

    const firstImg = selectedProds.find(p => p.image || p.photo_url)?.image || '';

    const defaultCaption = `🎁 Store Featured Collection:\n` +
      selectedProds.map(p => `• ${p.product_name || p.name} - $${p.price || '0.00'}`).join('\n') +
      `\n\nOrder your favorite gifts today at The Giftify! ✨\n\n#TheGiftify #GiftCollection #SpecialOffer`;

    postForm.setFieldsValue({
      title: `Collection: ${selectedProds[0]?.product_name || 'Gift Set'} (${selectedProds.length} items)`,
      content: defaultCaption,
      image_url: firstImg
    });

    setIsProductPickerOpen(false);
    message.success(`Selected ${selectedProds.length} store items for post!`);
  };

  // Render Platform Tags
  const renderPlatformBadges = (record) => {
    const platformArray = record.platforms || [];
    if (!platformArray || platformArray.length === 0) return <Tag>None</Tag>;
    return (
      <Space size={[0, 4]} wrap>
        {platformArray.includes('facebook') && (
          <Tag icon={<FacebookOutlined />} color="#1877F2" style={{ borderRadius: 12 }}>
            Facebook
          </Tag>
        )}
        {platformArray.includes('telegram') && (
          <Tag icon={<SendOutlined />} color="#229ED9" style={{ borderRadius: 12 }}>
            Telegram
          </Tag>
        )}
        {platformArray.includes('tiktok') && (
          <Tag icon={<ShareAltOutlined />} color="#000000" style={{ borderRadius: 12 }}>
            TikTok
          </Tag>
        )}
      </Space>
    );
  };

  // Statistics calculation
  const recurringCount = posts.filter(p => (p.schedule_type === 'DAILY_RECURRING' || p.schedule_type === 'WEEKLY_RECURRING') && p.is_active).length;
  const scheduledCount = posts.filter(p => p.schedule_type === 'ONE_TIME' && p.status === 'SCHEDULED').length;
  const successLogCount = logs.filter(l => l.status === 'SUCCESS').length;
  const successRate = logs.length > 0 ? Math.round((successLogCount / logs.length) * 100) : 100;

  // Filter Posts for Specific Day of Week for Calendar View
  const getPostsForDay = (dayValue) => {
    return posts.filter(p => {
      if (!p.is_active) return false;
      if (p.schedule_type === 'DAILY_RECURRING') return true;
      if (p.schedule_type === 'WEEKLY_RECURRING') {
        const days = p.recurring_days || [];
        return days.includes(dayValue);
      }
      return false;
    });
  };

  // Table Columns
  const postColumns = [
    {
      title: 'Campaign Title & Caption',
      key: 'title',
      render: (_, record) => {
        const attCount = record.attachments?.length || 0;
        return (
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontWeight: 700, color: '#4a2e35', fontSize: 14 }}>{record.title}</div>
            <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.content}
            </div>
            <Space size="small" style={{ marginTop: 4 }}>
              {(record.image_url || record.image_file_url || attCount > 0) && (
                <Tag color="purple" style={{ fontSize: 10, borderRadius: 10 }}>
                  🖼️ Multi-Photos ({attCount + (record.image_file_url || record.image_url ? 1 : 0)})
                </Tag>
              )}
            </Space>
          </div>
        );
      }
    },
    {
      title: 'Target Platforms',
      key: 'platforms',
      render: (_, record) => renderPlatformBadges(record)
    },
    {
      title: 'Schedule Mode & Days',
      key: 'schedule_type',
      render: (_, record) => {
        if (record.schedule_type === 'WEEKLY_RECURRING') {
          const daysArr = record.recurring_days || [];
          return (
            <div>
              <Tag color="purple" icon={<CalendarOutlined />} style={{ borderRadius: 12, fontWeight: 700 }}>
                Weekly Recurring
              </Tag>
              <div style={{ fontSize: 12, color: '#4a2e35', marginTop: 4, fontWeight: 600 }}>
                📅 Days: {daysArr.join(', ') || 'Every Week'}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                ⏰ Time: {record.daily_time || '09:00'}
              </div>
            </div>
          );
        } else if (record.schedule_type === 'DAILY_RECURRING') {
          return (
            <div>
              <Tag color="gold" icon={<SyncOutlined spin={record.is_active} />} style={{ borderRadius: 12, fontWeight: 700 }}>
                Every Day (Daily)
              </Tag>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 600 }}>
                ⏰ Every day at {record.daily_time || '09:00'}
              </div>
            </div>
          );
        } else if (record.schedule_type === 'ONE_TIME') {
          return (
            <div>
              <Tag color="blue" icon={<ClockCircleOutlined />} style={{ borderRadius: 12 }}>One-Time</Tag>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                📅 {record.scheduled_at ? dayjs(record.scheduled_at).format('MMM DD, YYYY HH:mm') : 'Not set'}
              </div>
            </div>
          );
        } else {
          return <Tag color="cyan" icon={<ThunderboltOutlined />} style={{ borderRadius: 12 }}>Immediate</Tag>;
        }
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const color = record.status === 'PUBLISHED' ? 'green' : record.status === 'SCHEDULED' ? 'processing' : 'volcano';
        return (
          <div>
            <Tag color={color} style={{ borderRadius: 10, fontWeight: 700 }}>
              {record.status_display || record.status}
            </Tag>
            {record.last_published_at && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                Last: {dayjs(record.last_published_at).format('MM/DD HH:mm')}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Auto-Post Active',
      key: 'is_active',
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Trigger Immediate Post Now">
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              style={{ background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)', border: 'none', borderRadius: 8 }}
              onClick={() => handlePublishNow(record.id)}
            >
              Post Now
            </Button>
          </Tooltip>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{ borderRadius: 8 }}
            onClick={() => {
              setEditingPost(record);
              postForm.setFieldsValue({
                ...record,
                scheduled_at: record.scheduled_at ? dayjs(record.scheduled_at) : null,
                daily_time: record.daily_time ? dayjs(record.daily_time, 'HH:mm:ss') : null,
              });
              setIsPostModalOpen(true);
            }}
          />
          <Popconfirm title="Delete this post schedule?" onConfirm={() => handleDeletePost(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Log Columns
  const logColumns = [
    {
      title: 'Execution Time',
      dataIndex: 'executed_at',
      key: 'executed_at',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (val) => {
        if (val === 'facebook') return <Tag icon={<FacebookOutlined />} color="#1877F2">Facebook</Tag>;
        if (val === 'telegram') return <Tag icon={<SendOutlined />} color="#229ED9">Telegram</Tag>;
        return <Tag color="#000000">TikTok</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val) => val === 'SUCCESS' ? (
        <Tag color="success" icon={<CheckCircleOutlined />}>SUCCESS</Tag>
      ) : (
        <Tag color="error" icon={<CloseCircleOutlined />}>FAILED</Tag>
      )
    },
    {
      title: 'Details / Platform Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'External ID',
      dataIndex: 'external_post_id',
      key: 'external_post_id',
      render: (val) => val ? <code>{val}</code> : '-'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fdfbfb' }}>
      <Sidebar />
      <Layout style={{ padding: '24px 32px', background: 'transparent' }}>
        <Content>
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fff0f3 50%, #f3e8ff 100%)',
              padding: '24px 28px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 174, 173, 0.3)',
              boxShadow: '0 8px 24px rgba(255, 174, 173, 0.12)',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div>
              <h1 style={{ margin: 0, color: '#4a2e35', fontSize: '26px', fontWeight: 800 }}>
                Social Media Auto-Poster <ShareAltOutlined style={{ color: '#ff758c' }} />
              </h1>
              <p style={{ margin: '6px 0 0 0', color: '#7a5a63', fontSize: '14px', fontWeight: 600 }}>
                Weekly Content Calendar & Auto-Posting loop. Schedule item A on Mondays, item B on Tuesdays, or multi-posts per day! 🗓️
              </p>
            </div>
            <Space wrap>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={fetchData}
                loading={loading}
                style={{ borderRadius: 12, fontWeight: 700 }}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  height: 40,
                  padding: '0 20px',
                  boxShadow: '0 4px 14px rgba(255, 117, 140, 0.4)'
                }}
                onClick={() => {
                  setEditingPost(null);
                  postForm.resetFields();
                  setImageFileList([]);
                  setVideoFileList([]);
                  setSelectedProductIds([]);
                  postForm.setFieldsValue({
                    schedule_type: 'WEEKLY_RECURRING',
                    recurring_days: ['MON'],
                    platforms: ['facebook', 'telegram', 'tiktok'],
                    fb_post_type: 'FEED',
                    tiktok_post_type: 'PHOTO_CAROUSEL',
                    telegram_post_type: 'PHOTO',
                    is_active: true,
                    daily_time: dayjs('09:00:00', 'HH:mm:ss')
                  });
                  setIsPostModalOpen(true);
                }}
              >
                + Schedule New Post
              </Button>
            </Space>
          </div>

          {/* Quick Stats Grid */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, border: '1px solid rgba(255,174,173,0.3)', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#666' }}>Connected Channels</span>}
                  value={accounts.length}
                  prefix={<SettingOutlined style={{ color: '#ff758c' }} />}
                  valueStyle={{ color: '#4a2e35', fontWeight: 800 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, border: '1px solid rgba(255,174,173,0.3)', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#666' }}>Active Recurring Schedules</span>}
                  value={recurringCount}
                  prefix={<SyncOutlined spin style={{ color: '#e67e22' }} />}
                  valueStyle={{ color: '#d35400', fontWeight: 800 }}
                  suffix={<span style={{ fontSize: 12, color: '#888' }}>(Weekly / Daily)</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, border: '1px solid rgba(255,174,173,0.3)', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#666' }}>One-Time Scheduled</span>}
                  value={scheduledCount}
                  prefix={<ClockCircleOutlined style={{ color: '#3498db' }} />}
                  valueStyle={{ color: '#2980b9', fontWeight: 800 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, border: '1px solid rgba(255,174,173,0.3)', background: 'white' }}>
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#666' }}>Publish Success Rate</span>}
                  value={successRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: '#2ecc71' }} />}
                  valueStyle={{ color: '#27ae60', fontWeight: 800 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Card with Tabs */}
          <Card
            style={{
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid rgba(255, 174, 173, 0.3)'
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'calendar',
                  label: <span><CalendarOutlined /> Weekly Content Calendar Planner</span>,
                  children: (
                    <div>
                      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#4a2e35', fontWeight: 800 }}>🗓️ 7-Day Weekly Content Calendar</h3>
                          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                            Visual weekly queue. Items set on each day repeat every single week automatically ("Infinite Loop").
                          </p>
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          style={{ borderRadius: 10, background: '#ff758c', borderColor: '#ff758c', fontWeight: 700 }}
                          onClick={() => {
                            setEditingPost(null);
                            postForm.resetFields();
                            setImageFileList([]);
                            setVideoFileList([]);
                            setSelectedProductIds([]);
                            postForm.setFieldsValue({
                              schedule_type: 'WEEKLY_RECURRING',
                              recurring_days: ['MON'],
                              platforms: ['facebook', 'telegram', 'tiktok'],
                              fb_post_type: 'FEED',
                              tiktok_post_type: 'PHOTO_CAROUSEL',
                              telegram_post_type: 'PHOTO',
                              is_active: true,
                              daily_time: dayjs('09:00:00', 'HH:mm:ss')
                            });
                            setIsPostModalOpen(true);
                          }}
                        >
                          Add Post to Calendar
                        </Button>
                      </div>

                      {/* 7 Columns Weekly Grid */}
                      <Row gutter={[12, 12]}>
                        {DAYS_OF_WEEK.map((day) => {
                          const dayPosts = getPostsForDay(day.value);
                          return (
                            <Col xs={24} sm={12} md={8} lg={3} key={day.value} style={{ minWidth: 160, flex: 1 }}>
                              <div
                                style={{
                                  background: '#ffffff',
                                  borderRadius: 16,
                                  border: `2px solid ${day.color}33`,
                                  minHeight: 380,
                                  display: 'flex',
                                  flexDirection: 'column'
                                }}
                              >
                                {/* Header Day Title */}
                                <div
                                  style={{
                                    background: `linear-gradient(135deg, ${day.color} 0%, ${day.color}dd 100%)`,
                                    color: 'white',
                                    padding: '10px 12px',
                                    borderRadius: '14px 14px 0 0',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>{day.label}</span>
                                  <Badge count={dayPosts.length} style={{ backgroundColor: 'white', color: day.color, fontWeight: 800 }} />
                                </div>

                                {/* Posts Container */}
                                <div style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {dayPosts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 4px', color: '#ccc', fontSize: 12 }}>
                                      No posts set for {day.label}
                                    </div>
                                  ) : (
                                    dayPosts.map((p) => (
                                      <Card
                                        key={p.id}
                                        size="small"
                                        style={{
                                          borderRadius: 12,
                                          border: '1px solid #ffe4e6',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                          background: '#fff9fa'
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                          <Tag color="gold" style={{ fontSize: 10, borderRadius: 8, fontWeight: 700 }}>
                                            ⏰ {p.daily_time || '09:00'}
                                          </Tag>
                                          {renderPlatformBadges(p)}
                                        </div>

                                        <div style={{ fontWeight: 700, color: '#4a2e35', fontSize: 13, marginBottom: 2 }}>
                                          {p.title}
                                        </div>

                                        <div style={{ fontSize: 11, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                                          {p.content}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Tooltip title="Post Immediately Now">
                                            <Button
                                              type="primary"
                                              size="small"
                                              icon={<ThunderboltOutlined />}
                                              style={{ background: '#ff758c', borderColor: '#ff758c', fontSize: 11, borderRadius: 6 }}
                                              onClick={() => handlePublishNow(p.id)}
                                            >
                                              Post Now
                                            </Button>
                                          </Tooltip>

                                          <Space size={2}>
                                            <Button
                                              size="small"
                                              type="text"
                                              icon={<EditOutlined />}
                                              onClick={() => {
                                                setEditingPost(p);
                                                postForm.setFieldsValue({
                                                  ...p,
                                                  scheduled_at: p.scheduled_at ? dayjs(p.scheduled_at) : null,
                                                  daily_time: p.daily_time ? dayjs(p.daily_time, 'HH:mm:ss') : null,
                                                });
                                                setIsPostModalOpen(true);
                                              }}
                                            />
                                            <Popconfirm title="Delete?" onConfirm={() => handleDeletePost(p.id)}>
                                              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                          </Space>
                                        </div>
                                      </Card>
                                    ))
                                  )}
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )
                },
                {
                  key: '1',
                  label: <span><ClockCircleOutlined /> Active Campaigns List ({posts.length})</span>,
                  children: (
                    <Table
                      columns={postColumns}
                      dataSource={posts}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 8 }}
                    />
                  )
                },
                {
                  key: '2',
                  label: <span><SettingOutlined /> Channel API Credentials ({accounts.length})</span>,
                  children: (
                    <div>
                      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, color: '#666' }}>
                          Configure Facebook Page tokens, Telegram Bot tokens, and TikTok API tokens. Simulated mode enables full testing without network errors.
                        </p>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          style={{ borderRadius: 10, background: '#ff758c', borderColor: '#ff758c' }}
                          onClick={() => {
                            setEditingAccount(null);
                            accountForm.resetFields();
                            accountForm.setFieldsValue({ platform: 'facebook', is_active: true, is_simulated: true });
                            setIsAccountModalOpen(true);
                          }}
                        >
                          Add Social Account
                        </Button>
                      </div>

                      <Row gutter={[16, 16]}>
                        {accounts.length === 0 ? (
                          <Col span={24}>
                            <Card style={{ textAlign: 'center', padding: 30, borderRadius: 16, background: '#fff0f3' }}>
                              <SettingOutlined style={{ fontSize: 36, color: '#ff758c', marginBottom: 12 }} />
                              <h3>No Connected Accounts Yet</h3>
                              <p>Click "Add Social Account" above to connect Facebook, Telegram, or TikTok!</p>
                            </Card>
                          </Col>
                        ) : (
                          accounts.map((acc) => (
                            <Col xs={24} sm={12} md={8} key={acc.id}>
                              <Card
                                title={
                                  <Space>
                                    {acc.platform === 'facebook' && <FacebookOutlined style={{ color: '#1877F2', fontSize: 20 }} />}
                                    {acc.platform === 'telegram' && <SendOutlined style={{ color: '#229ED9', fontSize: 20 }} />}
                                    {acc.platform === 'tiktok' && <ShareAltOutlined style={{ color: '#000', fontSize: 20 }} />}
                                    <span>{acc.name}</span>
                                  </Space>
                                }
                                extra={
                                  <Tag color={acc.is_active ? 'green' : 'red'}>
                                    {acc.is_active ? 'Active' : 'Inactive'}
                                  </Tag>
                                }
                                style={{ borderRadius: 16, border: '1px solid #ffe4e6' }}
                              >
                                <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                                  <div><strong>Platform:</strong> {acc.platform_display || acc.platform}</div>
                                  <div><strong>Target ID:</strong> {acc.page_id_or_chat_id || 'Not set'}</div>
                                  <div>
                                    <strong>Mode:</strong> {acc.is_simulated ? (
                                      <Tag color="orange">Simulated Test Mode</Tag>
                                    ) : (
                                      <Tag color="green">Live API Mode</Tag>
                                    )}
                                  </div>
                                </div>

                                {acc.platform === 'tiktok' && (
                                  <Button
                                    block
                                    type="primary"
                                    icon={<KeyOutlined />}
                                    style={{ marginBottom: 10, borderRadius: 8, background: '#000000', borderColor: '#000000' }}
                                    onClick={() => startTikTokOAuth(acc.app_id_or_bot_token)}
                                  >
                                    🔑 1-Click Auto Authenticate with TikTok
                                  </Button>
                                )}

                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Button
                                    size="small"
                                    type="dashed"
                                    loading={testingAccountId === acc.id}
                                    onClick={() => handleTestConnection(acc.id)}
                                    style={{ borderRadius: 8 }}
                                  >
                                    Test Connection
                                  </Button>
                                  <Space>
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setEditingAccount(acc);
                                        accountForm.setFieldsValue(acc);
                                        setIsAccountModalOpen(true);
                                      }}
                                    />
                                    <Popconfirm
                                      title="Delete this account configuration?"
                                      onConfirm={async () => {
                                        await api.delete(`/social/accounts/${acc.id}/`);
                                        message.success('Account deleted');
                                        fetchData();
                                      }}
                                    >
                                      <Button danger size="small" icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                  </Space>
                                </Space>
                              </Card>
                            </Col>
                          ))
                        )}
                      </Row>
                    </div>
                  )
                },
                {
                  key: '3',
                  label: <span><HistoryOutlined /> Auto-Posting Execution Logs ({logs.length})</span>,
                  children: (
                    <Table
                      columns={logColumns}
                      dataSource={logs}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                    />
                  )
                }
              ]}
            />
          </Card>

          {/* Modal 1: Create / Edit Social Post */}
          <Modal
            title={editingPost ? "Edit Social Schedule" : "Compose & Schedule Post"}
            open={isPostModalOpen}
            onCancel={() => setIsPostModalOpen(false)}
            footer={null}
            width={750}
            style={{ borderRadius: 20 }}
          >
            <Form form={postForm} layout="vertical" onFinish={handleSavePost}>
              <Row gutter={16}>
                <Col span={17}>
                  <Form.Item
                    name="title"
                    label="Campaign Title / Item Name"
                    rules={[{ required: true, message: 'Please enter post title' }]}
                  >
                    <Input placeholder="e.g. Item A - Cute Cartoon Figures" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Button
                    type="dashed"
                    icon={<ShoppingOutlined style={{ color: '#ff758c' }} />}
                    style={{ marginTop: 30, width: '100%', borderRadius: 10, borderColor: '#ff758c', color: '#ff758c', fontWeight: 600 }}
                    onClick={() => {
                      setSelectedProductIds([]);
                      setIsProductPickerOpen(true);
                    }}
                  >
                    Pick Store Products
                  </Button>
                </Col>
              </Row>

              <Form.Item
                name="content"
                label="Post Caption & Description"
                rules={[{ required: true, message: 'Please enter post content' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Type your caption here... E.g. 'Good morning! Check out Item A today at The Giftify! 🛍️'"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>

              {/* Multi-File Uploaders */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Upload Photos (Album / Slideshow)">
                    <Upload
                      multiple
                      listType="picture"
                      maxCount={10}
                      beforeUpload={() => false}
                      fileList={imageFileList}
                      onChange={({ fileList }) => setImageFileList(fileList)}
                    >
                      <Button icon={<PictureOutlined />} style={{ borderRadius: 10, width: '100%' }}>
                        Select Images (Up to 10)
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Upload Videos (Reels / TikTok)">
                    <Upload
                      multiple
                      maxCount={5}
                      beforeUpload={() => false}
                      fileList={videoFileList}
                      onChange={({ fileList }) => setVideoFileList(fileList)}
                    >
                      <Button icon={<VideoCameraOutlined />} style={{ borderRadius: 10, width: '100%' }}>
                        Select Videos (Up to 5)
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {/* Target Platforms Checkboxes */}
              <Form.Item
                name="platforms"
                label="Target Platforms to Auto-Post"
                rules={[{ required: true, message: 'Select at least one platform' }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Checkbox value="facebook">
                        <Space><FacebookOutlined style={{ color: '#1877F2' }} /> Facebook</Space>
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="telegram">
                        <Space><SendOutlined style={{ color: '#229ED9' }} /> Telegram</Space>
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="tiktok">
                        <Space><ShareAltOutlined style={{ color: '#000' }} /> TikTok</Space>
                      </Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              {/* Scheduling Mode Selection */}
              <Form.Item
                name="schedule_type"
                label="Scheduling Mode"
                rules={[{ required: true, message: 'Select scheduling mode' }]}
              >
                <Select
                  style={{ borderRadius: 10 }}
                  options={[
                    { label: '🗓️ Weekly Recurring Days (e.g. Post Item A every Monday, Item B every Tuesday...)', value: 'WEEKLY_RECURRING' },
                    { label: '⏰ Daily Recurring (Post every single day)', value: 'DAILY_RECURRING' },
                    { label: '📅 One-time Scheduled (Specific Date & Time)', value: 'ONE_TIME' },
                    { label: '⚡ Immediate (Publish Right Now)', value: 'IMMEDIATE' },
                  ]}
                />
              </Form.Item>

              {/* Dynamic inputs depending on schedule_type */}
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schedule_type !== curr.schedule_type}>
                {({ getFieldValue }) => {
                  const mode = getFieldValue('schedule_type');

                  if (mode === 'WEEKLY_RECURRING') {
                    return (
                      <div style={{ background: '#fcf4ff', padding: 16, borderRadius: 14, marginBottom: 16, border: '1px solid #f0d5ff' }}>
                        <Form.Item
                          name="recurring_days"
                          label="Select Recurring Day(s) of Week (Loops Forever)"
                          rules={[{ required: true, message: 'Select at least one day' }]}
                        >
                          <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[8, 8]}>
                              {DAYS_OF_WEEK.map((d) => (
                                <Col span={6} key={d.value}>
                                  <Checkbox value={d.value}>
                                    <strong style={{ color: d.color }}>{d.label}</strong>
                                  </Checkbox>
                                </Col>
                              ))}
                            </Row>
                          </Checkbox.Group>
                        </Form.Item>

                        <Form.Item
                          name="daily_time"
                          label="Target Posting Time on Selected Day(s)"
                          rules={[{ required: true, message: 'Select posting time' }]}
                        >
                          <TimePicker format="HH:mm" style={{ width: '100%', borderRadius: 10 }} />
                        </Form.Item>
                        <span style={{ fontSize: 12, color: '#6b21a8' }}>
                          💡 <b>Example:</b> If you set Item A on <b>Monday at 09:00</b>, it will publish every Monday at 9:00 AM automatically until changed!
                        </span>
                      </div>
                    );
                  }

                  if (mode === 'DAILY_RECURRING') {
                    return (
                      <div style={{ background: '#fff0f3', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                        <Form.Item
                          name="daily_time"
                          label="Daily Auto-Post Time"
                          rules={[{ required: true, message: 'Select daily post time' }]}
                        >
                          <TimePicker format="HH:mm" style={{ width: '100%', borderRadius: 10 }} />
                        </Form.Item>
                      </div>
                    );
                  }

                  if (mode === 'ONE_TIME') {
                    return (
                      <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                        <Form.Item
                          name="scheduled_at"
                          label="Target Publishing Date & Time"
                          rules={[{ required: true, message: 'Select date and time' }]}
                        >
                          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%', borderRadius: 10 }} />
                        </Form.Item>
                      </div>
                    );
                  }
                  return null;
                }}
              </Form.Item>

              <Form.Item name="is_active" valuePropName="checked">
                <Checkbox defaultChecked>Enable Auto-Posting Schedule immediately</Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button onClick={() => setIsPostModalOpen(false)} style={{ borderRadius: 10 }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ background: '#ff758c', borderColor: '#ff758c', borderRadius: 10, padding: '0 24px' }}
                >
                  Save Post Schedule
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal 2: Social Account API Form */}
          <Modal
            title={editingAccount ? "Edit Social Account" : "Add Social Media Channel"}
            open={isAccountModalOpen}
            onCancel={() => setIsAccountModalOpen(false)}
            footer={null}
            style={{ borderRadius: 20 }}
          >
            <Form form={accountForm} layout="vertical" onFinish={handleSaveAccount}>
              <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Facebook Page', value: 'facebook' },
                    { label: 'Telegram Group/Channel', value: 'telegram' },
                    { label: 'TikTok Account', value: 'tiktok' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="name" label="Account Display Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Official Facebook Page" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item name="page_id_or_chat_id" label="Facebook Page ID / Telegram Chat ID / TikTok User ID">
                <Input placeholder="e.g. 104829102910 or @my_gift_channel" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item name="app_id_or_bot_token" label="Telegram Bot Token / TikTok Client Key">
                <Input.Password placeholder="Enter Bot Token or TikTok Client Key..." style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item name="access_token" label="OAuth / Page Access Token">
                <TextArea rows={3} placeholder="Paste long-lived access token here..." style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item name="is_simulated" valuePropName="checked">
                <Checkbox>
                  Simulated Test Mode (Generates instant mock success responses without real network calls)
                </Checkbox>
              </Form.Item>

              <Form.Item name="is_active" valuePropName="checked">
                <Checkbox defaultChecked>Account Active</Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button onClick={() => setIsAccountModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ background: '#ff758c', borderColor: '#ff758c' }}>
                  Save Account
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal 3: Pick Multiple Store Inventory Products */}
          <Modal
            title="Pick Store Products to Auto-Post"
            open={isProductPickerOpen}
            onCancel={() => setIsProductPickerOpen(false)}
            onOk={handleConfirmProductSelection}
            okText={`Use ${selectedProductIds.length} Selected Products`}
            okButtonProps={{ style: { background: '#ff758c', borderColor: '#ff758c' } }}
            width={720}
          >
            <p style={{ color: '#666', marginTop: 0 }}>Click on products below to select them for your post caption & album:</p>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
              <Row gutter={[12, 12]}>
                {products.map((prod) => {
                  const prodId = prod.id || prod.code;
                  const isSelected = selectedProductIds.includes(prodId);
                  return (
                    <Col span={12} key={prodId}>
                      <Card
                        hoverable
                        size="small"
                        style={{
                          borderRadius: 12,
                          border: isSelected ? '2px solid #ff758c' : '1px solid #ffe4e6',
                          background: isSelected ? '#fff0f3' : '#ffffff'
                        }}
                        onClick={() => handleToggleProductSelection(prod)}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {prod.image ? (
                            <img src={prod.image} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: 8, background: '#fff0f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingOutlined style={{ color: '#ff758c', fontSize: 20 }} />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#4a2e35' }}>{prod.product_name || prod.name}</div>
                            <div style={{ fontSize: 12, color: '#ff758c', fontWeight: 700 }}>${prod.price || '0.00'}</div>
                          </div>
                          {isSelected && <CheckCircleOutlined style={{ color: '#ff758c', fontSize: 18 }} />}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Modal>

        </Content>
      </Layout>
    </Layout>
  );
};

export default SocialPublisherScreen;
