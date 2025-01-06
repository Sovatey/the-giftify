import { defineConfig } from '@umijs/max';
import logo from './src/assets/images/logo.jpg';
import icons from "@/.umi/plugin-layout/icons";
import { message, Modal } from 'antd';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'The Giftify',
  },
  routes: [
    {
      path: '/',
      redirect: './login',
    },
    {
      path: '/login',
      component: './login',
      layout: false,
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      // component: './dashboard',
      icon: 'DashboardOutlined',
    },
    {
      name: 'Home',
      path: '/home',
      component: './Home',
      icon: 'HomeOutlined',
    },
    {
      name: 'Inventory',
      path: '/inventory',
      // component: './inventory',
      icon: 'InventoryOutlined',
    },
    {
      name: 'Logout',
      path: '/logout',
      // component: './inventory',
      icon: 'LogoutOutlined',
    },
    // {
    //   name: 'Access',
    //   path: '/access',
    //   component: './Access',
    // },
    // {
    //   name: ' Table',
    //   path: '/table',
    //   component: './Table',
    // },
  ],
  npmClient: 'npm',
});
