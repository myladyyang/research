// 导出API基础服务
export * from './api';

// 导出气候数据服务
export * from './research';


// 服务实例集中导出
import { api } from './api';
import { researchService } from './research';


export const services = {
  api,
  research: researchService,
};

export default services; 