import { Button, Modal } from 'antd';
import React from 'react';

const FormModalComp = ({
  title,
  open,
  visible,
  readOnly,
  width,
  okText,
  confirmLoading,
  footer,
  onSubmit,
  onCancel,
  onResetForm,
  isHiddenReset,
  disabled,
  children,
  maskClosable,
}) => {
  return (
    <Modal
      styles={{
        body: {
          backgroundColor: '#fafafa'
        }
      }}
      title={title}
      open={open || visible}
      onCancel={() => onCancel?.()}
      destroyOnClose
      width={width || '1000px'}
      maskClosable={maskClosable === undefined ? true : maskClosable}
      footer={
        footer || [
          <Button key="cancel" onClick={() => onCancel?.()}>
            Cancel
          </Button>,
          onResetForm && (
            <Button hidden={readOnly || isHiddenReset} key="reset" onClick={onResetForm}>
              Reset
            </Button>
          ),
          <Button
            style={{ backgroundColor: '#ffaead' }}
            loading={confirmLoading}
            disabled={disabled}
            hidden={readOnly}
            key="submit"
            type="primary"
            onClick={onSubmit}
          >
            {okText || 'Submit'}
          </Button>,
        ]
      }
    >
      {children}
    </Modal>
  );
};

export default FormModalComp;
