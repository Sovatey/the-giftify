import { NotifitionList, RePstFailedBroadcast } from '@/services/accounting/api';
import { WarningOutlined } from '@ant-design/icons';
import { SelectLang as UmiSelectLang, history } from '@umijs/max';
import { Badge, Button, List, Modal, notification } from 'antd';
import React, { useEffect } from 'react';
import { requestAPIV2 } from '../JavaScriptFunction';

export type SiderTheme = 'light' | 'dark';

export const SelectLang = () => {
  return (
    <UmiSelectLang
      style={{
        padding: 4,
      }}
    />
  );
};

export const Question = () => {
  const [api, contextHolder] = notification.useNotification();
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState([]);

  const onNotifitions = async () => {
    try {
      const data12 = await requestAPIV2(NotifitionList());
      if (data12.status !== 200) {
        return Promise.reject("Can not load failed broadcast!")
      }

      const headerData = data12.data.data.header;
      setNotifications(headerData);
      setNotificationCount(data12.data.data.header.length);
    } catch (err) {
      console.error(err);
    }
  };

  const onPostFailedBroadcast = async () => {
    try {
      Modal.confirm({
        title   : 'Redo Broadcasting Data',
        content : 'Are you sure?',
        onOk    : async () => {
          const data12 = await requestAPIV2(RePstFailedBroadcast());
          if (data12.status !== 200) {
            return Promise.reject("Can not load failed broadcast!")
          }

          window.location.href = window.location.href;
          return Promise.resolve();
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    onNotifitions();
  }, [history.location]);

  const openNotification = () => {
    api.open({
      message: 'Failed Broadcast',
      description: (
        <div
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <hr />
          <List
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <>
                    <Button type="link" onClick={() => (window.location.href = `/failedbroadcast/${item.type}`)}>View</Button>
                  </>
                ]}
              >
                <List.Item.Meta title={item.type} description={item.detail} />
              </List.Item>
            )}
          />
          <hr />
          <div style={{ textAlign: 'right' }}>
            <Button 
              hidden={notificationCount===0} 
              type='primary'
              onClick={async () => await onPostFailedBroadcast()}
            >POST</Button>
          </div>
        </div>
      ),
      style: {marginTop: '30px'},
    });
  };

  return (
    <>
      {contextHolder}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <Badge count={notificationCount} overflowCount={9}>
          <WarningOutlined style={{ fontSize: '24px', cursor: 'pointer' }} onClick={openNotification} />
        </Badge>
      </div>
    </>
  );
};
