import React, { useEffect } from 'react';
import { Modal, Form, Input, Divider } from 'antd';
// import FormModalComp from '../../components/FormModal';

const SignupModelForm = ({ open, onCancel, onSubmit, title, loading }) => {

    const [form] = Form.useForm();
    const okButtonText = "Submit";
    const okButtonStyle = {
        backgroundColor: '#ffaead',
        color: 'white',
        border: 'none',
    };

    const handleSubmit = () => {
        form.validateFields()
          .then(values => {
            onSubmit(values); // Pass form data to parent component
          })
          .catch(info => {
            console.log('Validation Failed:', info);
          });
      };
    
      useEffect(()=>{
        if(open){
            form.resetFields();
        }
      },[open])

    return (
        <Modal
            title={title}
            open={open} // Control modal visibility from parent state
            onOk={handleSubmit}
            confirmLoading={loading}
            onCancel={onCancel}
            okText={okButtonText} // Change Ok button text
            okButtonProps={{
                style: okButtonStyle, // Change Ok button style
                disabled: loading, // Disable Ok button when loading
            }}
        >
            <Divider />
            <Form
                layout="vertical"
                form={form}
                // onFinish={handleLogin}
            >
                <Form.Item
                    label="First Name"
                    name="first_name"
                    rules={[{ required: true, message: 'Please enter your First Name!' }]}
                >
                    <Input placeholder="Enter your First Name" />
                </Form.Item>

                <Form.Item
                    label="Last Name"
                    name="last_name"
                    rules={[{ required: true, message: 'Please enter your Last Name!' }]}
                >
                    <Input placeholder="Enter your Last Name" />
                </Form.Item>
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please enter your username!' }]}
                >
                    <Input placeholder="Enter your username" />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password!' }]}
                >
                    <Input.Password placeholder="Enter your password" />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter your email!' }]}
                >
                    <Input placeholder="Enter your email" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SignupModelForm;
