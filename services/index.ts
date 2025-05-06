// 导出API基础服务
export * from './api';


// 服务实例集中导出
import { api } from './api';


export const services = {
  api,
};

export default services; 