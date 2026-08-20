import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col } from "antd";
import dayjs from 'dayjs';

const ModelForm = ({ open, title, onCancel, onSubmit, loading, initialValues, categories = [], isRestock = false }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    ...initialValues,
                    order_date: initialValues.order_date ? dayjs(initialValues.order_date) : dayjs(),
                    received_date: initialValues.received_date ? dayjs(initialValues.received_date) : dayjs(),
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    order_date: dayjs(),
                    received_date: dayjs(),
                    min_stock_alert: 5,
                    stock_qty: 10,
                    price: 0,
                    cost: 0
                });
            }
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then((values) => {
            const formatted = {
                ...values,
                order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : undefined,
                received_date: values.received_date ? values.received_date.format('YYYY-MM-DD') : undefined,
            };
            onSubmit(formatted);
        });
    };

    return (
        <Modal
            open={open}
            title={title}
            okText={isRestock ? "Save Restock Intake" : "Save Product"}
            cancelText="Cancel"
            confirmLoading={loading}
            onCancel={onCancel}
            onOk={handleOk}
            width={600}
        >
            <Form form={form} layout="vertical">
                {isRestock ? (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="qty" label="Restock Quantity" rules={[{ required: true }]}>
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="unit_price" label="Unit Cost Price ($)" rules={[{ required: true }]}>
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="supplier" label="Supplier Name">
                                    <Input placeholder="e.g. Gift Import Co., Ltd" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="delivery_price" label="Delivery Cost ($)">
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="order_date" label="Order Date">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="received_date" label="Received Date">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="description" label="Notes / Description">
                            <Input.TextArea rows={2} placeholder="Optional restock notes..." />
                        </Form.Item>
                    </>
                ) : (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                                    <Input placeholder="e.g. Giant Pink Teddy Bear" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="barcode" label="Barcode / SKU">
                                    <Input placeholder="e.g. GIFT-001" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="category" label="Category">
                                    <Select placeholder="Select category">
                                        {categories.map(c => (
                                            <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="image_url" label="Image URL">
                                    <Input placeholder="https://..." />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="price" label="Selling Price ($)" rules={[{ required: true }]}>
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="cost" label="Cost Price ($)">
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="stock_qty" label="Initial Stock Qty" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="min_stock_alert" label="Low Stock Alert Threshold">
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={2} placeholder="Gift specifications and detail..." />
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default ModelForm;
