// // 运行时配置

// // 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// // 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
import logo from './assets/images/logo-round.png';

// export async function getInitialState(): Promise<{ name: string }> {
//   return { name: '@umijs/max' };
// }

export const layout = () => {
  return {
    logo: logo,
    menu: {
      locale: false,
    },
  };
};
