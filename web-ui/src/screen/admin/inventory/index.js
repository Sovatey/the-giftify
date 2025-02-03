import React, { useState } from "react";
import { Layout, Table, Divider, Button, Card, Tooltip } from 'antd';
import Sidebar from '../../sidebar';
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import ModelForm from './modalform'
const { Content } = Layout;

const InventoryScreen = () => {
    const [openModel, setOpenModel] = useState(false)
    const [loading, setLoading] = useState(false)
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar />
            <Layout >
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#fff',
                    }}
                >
                    <h2>Inventory</h2>
                    <Divider />
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                            <Tooltip title="Add New Stock">
                                <Button
                                    key="click-add"
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() => setOpenModel(true)}
                                />
                            </Tooltip>
                            <Tooltip title="Refresh">
                                <Button
                                    key="click-refresh"
                                    type="link"
                                    icon={<ReloadOutlined />}
                                    style={{
                                        color: 'black',
                                    }}
                                // onClick={() => onAddHandler()}
                                />
                            </Tooltip>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'No',
                                    dataIndex: 'name',
                                    render: (_, data, index) => { return index + 1 }
                                },
                                {
                                    title: 'Order Date',
                                    dataIndex: 'order_date',
                                    key: 'order_date',
                                },
                                {
                                    title: 'Recieved Date',
                                    dataIndex: 'recieved_date',
                                    key: 'recieved_date',
                                },
                                {
                                    title: 'Product Name',
                                    dataIndex: 'product_name',
                                    key: 'product_name',
                                },
                                {
                                    title: 'Supplier',
                                    dataIndex: 'supplier',
                                    key: 'supplier',
                                },
                                {
                                    title: 'Description',
                                    dataIndex: 'description',
                                    key: 'description',
                                },
                                {
                                    title: 'Qty',
                                    dataIndex: 'qty',
                                    key: 'qty',
                                },
                                {
                                    title: 'UnitPrice',
                                    dataIndex: 'unit_price',
                                    key: 'unit_price',
                                },
                                {
                                    title: 'Sub Total Price',
                                    dataIndex: 'sub_total_price',
                                    key: 'sub_total_price',
                                },
                                {
                                    title: 'Delivery Price',
                                    dataIndex: 'delivery_price',
                                    key: 'delivery_price',
                                },
                            ]} />
                    </Card>

                </Content>
            </Layout>
            <ModelForm 
            title="Add Inventory"
            loading={loading}
            open={openModel} 
            setOpen={setOpenModel} 
            onSubmit={async() => {
                try {
                    setLoading(true)
                    await console.log('hi') // use await to get loading when submit
                  } catch (e) {

                  } finally {
                    setLoading(false);
                  }
                setOpenModel(false);    // Close the modal
              }}
            onCancel={() => setOpenModel(false)} 
            />
        </Layout>

    );
};

export default InventoryScreen;
