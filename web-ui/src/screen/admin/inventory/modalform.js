import React, { useState } from 'react';
import { Card, Modal } from 'antd';
import FormModalComp from '../../../components/FormModal';

const ModelForm = ({ open, onCancel, onSubmit, title,loading }) => {

  // Customize the Ok button text and style
  const okButtonText = "Submit";
  const okButtonStyle = {
    backgroundColor: '#ffaead',
    color: 'white',
    border: 'none',
  };
console.log(loading)
  return (
    <Modal
      title={title}
      open={open} // Control modal visibility from parent state
      onOk={onSubmit}
      confirmLoading={loading}
      onCancel={onCancel}
      okText={okButtonText} // Change Ok button text
      okButtonProps={{
        style: okButtonStyle, // Change Ok button style
        disabled: loading, // Disable Ok button when loading
      }}
    >
      <p>Hi</p>
    </Modal>
  );
};

export default ModelForm;
