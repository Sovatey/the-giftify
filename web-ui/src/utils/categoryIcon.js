import React from 'react';
import {
  GiftOutlined, HeartOutlined, SmileOutlined, FileTextOutlined,
  CrownOutlined, StarOutlined, FireOutlined
} from '@ant-design/icons';

export const renderCategoryIcon = (iconName, fontSize = 16) => {
  if (!iconName) return <GiftOutlined style={{ color: '#ff758c', fontSize }} />;

  switch (iconName) {
    case 'gift': return <GiftOutlined style={{ color: '#ff758c', fontSize }} />;
    case 'heart': return <HeartOutlined style={{ color: '#ff758c', fontSize }} />;
    case 'smile': return <SmileOutlined style={{ color: '#ff9190', fontSize }} />;
    case 'file-text': return <FileTextOutlined style={{ color: '#c084fc', fontSize }} />;
    case 'crown': return <CrownOutlined style={{ color: '#f59e0b', fontSize }} />;
    case 'star': return <StarOutlined style={{ color: '#eab308', fontSize }} />;
    case 'fire': return <FireOutlined style={{ color: '#ef4444', fontSize }} />;
    default:
      return <span style={{ fontSize, lineHeight: 1, display: 'inline-block' }}>{iconName}</span>;
  }
};
