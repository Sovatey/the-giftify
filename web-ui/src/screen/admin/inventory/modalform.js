import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Space, Upload, Tag } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { renderCategoryIcon } from '../../../utils/categoryIcon';

const ModelForm = ({ open, title, onCancel, onSubmit, loading, initialValues, categories = [], isRestock = false }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        if (open) {
            if (initialValues) {
                const colorArray = initialValues.color
                    ? initialValues.color.split(/[,/]/).map(c => c.trim()).filter(Boolean)
                    : [];

                form.setFieldsValue({
                    uom: 'Pcs',
                    ...initialValues,
                    color: colorArray,
                    order_date: initialValues.order_date ? dayjs(initialValues.order_date) : dayjs(),
                    received_date: initialValues.received_date ? dayjs(initialValues.received_date) : dayjs(),
                });

                const existingImg = initialValues.display_image_url || initialValues.image_url;
                if (existingImg) {
                    setFileList([{
                        uid: '-1',
                        name: 'product_image.png',
                        status: 'done',
                        url: existingImg
                    }]);
                } else {
                    setFileList([]);
                }
            } else {
                form.resetFields();
                setFileList([]);
                form.setFieldsValue({
                    order_date: dayjs(),
                    received_date: dayjs(),
                    min_stock_alert: 5,
                    stock_qty: 10,
                    price: 0,
                    cost: 0,
                    uom: 'Pcs',
                    color: []
                });
            }
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then((values) => {
            const formattedColor = Array.isArray(values.color)
                ? values.color.map(c => c.trim()).filter(Boolean).join(', ')
                : (values.color || '');

            const formatted = {
                ...values,
                color: formattedColor,
                order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : undefined,
                received_date: values.received_date ? values.received_date.format('YYYY-MM-DD') : undefined,
                image_file: fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : undefined,
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
            width={980}
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
                                            <Select.Option key={c.id} value={c.id}>
                                                <Space>{renderCategoryIcon(c.icon, 14)} {c.name}</Space>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Product Image (Upload Device File)">
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                                        beforeUpload={() => false}
                                        maxCount={1}
                                        accept="image/*"
                                    >
                                        {fileList.length < 1 && (
                                            <div style={{ textAlign: 'center' }}>
                                                <PictureOutlined style={{ fontSize: 22, color: '#ff758c' }} />
                                                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#4a2e35' }}>
                                                    Upload File
                                                </div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Variants & UOM Row */}
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="uom" label="Unit of Measure (UOM)">
                                    <Select placeholder="e.g. Pcs">
                                        <Select.Option value="Pcs">Pcs (Piece)</Select.Option>
                                        <Select.Option value="Box">Box</Select.Option>
                                        <Select.Option value="Set">Set</Select.Option>
                                        <Select.Option value="Pack">Pack</Select.Option>
                                        <Select.Option value="Dozen">Dozen</Select.Option>
                                        <Select.Option value="Pair">Pair</Select.Option>
                                        <Select.Option value="Kg">Kg</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="color" label="Color Variants (Select or type custom)">
                                    <Select
                                        mode="tags"
                                        placeholder="Select colors or type custom color..."
                                        style={{ width: '100%' }}
                                        tokenSeparators={[',']}
                                        allowClear
                                    >
                                        <Select.Option value="Pink">🎨 Pink</Select.Option>
                                        <Select.Option value="Red">🌹 Red</Select.Option>
                                        <Select.Option value="White">🤍 White</Select.Option>
                                        <Select.Option value="Blue">💙 Blue</Select.Option>
                                        <Select.Option value="Gold">✨ Gold</Select.Option>
                                        <Select.Option value="Black">🖤 Black</Select.Option>
                                        <Select.Option value="Purple">💜 Purple</Select.Option>
                                        <Select.Option value="Green">💚 Green</Select.Option>
                                        <Select.Option value="Yellow">💛 Yellow</Select.Option>
                                        <Select.Option value="Brown">🤎 Brown</Select.Option>
                                        <Select.Option value="Silver">🩶 Silver</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="size" label="Size / Specs">
                                    <Input placeholder="e.g. Giant 80cm, XL, 50ml" />
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
