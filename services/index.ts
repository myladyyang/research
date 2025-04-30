// 导出API基础服务
export * from './api';

// 导出气候数据服务
export * from './research';

// 导出用户服务
export * from './user';

// 导出数据分析服务
export * from './analytics';

// 服务实例集中导出
import { api } from './api';
import { climateService } from './research';
import { userService } from './user';
import { analyticsService } from './analytics';

export const services = {
  api,
  climate: climateService,
  user: userService,
  analytics: analyticsService
};

export default services; 