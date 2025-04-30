import { api } from './api';

// 用户接口
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'researcher';
  createdAt: string;
  lastLogin?: string;
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    reports: boolean;
    updates: boolean;
  };
  defaultModel?: string;
  defaultSource?: string;
}

// 认证请求接口
export interface AuthRequest {
  email: string;
  password: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// 注册请求
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'researcher';
}

// 密码重置请求
export interface PasswordResetRequest {
  email: string;
}

// 密码更新请求
export interface PasswordUpdateRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// 历史查询记录
export interface QueryHistory {
  id: string;
  userId: string;
  query: string;
  date: string;
  reportId?: string;
}

/**
 * 用户服务
 * 提供用户认证、管理和设置等功能
 */
class UserService {
  private tokenKey = 'climate_ai_token';
  private userKey = 'climate_ai_user';
  
  /**
   * 用户登录
   * @param credentials 登录凭据
   */
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // 保存认证信息到本地存储
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
    
    return response;
  }
  
  /**
   * 用户注册
   * @param data 注册信息
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // 保存认证信息到本地存储
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
    
    return response;
  }
  
  /**
   * 用户注销
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
      }
    }
  }
  
  /**
   * 发送密码重置邮件
   * @param data 包含邮箱的请求
   */
  async forgotPassword(data: PasswordResetRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', data);
  }
  
  /**
   * 重置密码
   * @param data 新密码信息
   */
  async resetPassword(data: PasswordUpdateRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', data);
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    // 先从本地存储获取
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem(this.userKey);
      if (userJson) {
        try {
          return JSON.parse(userJson) as User;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    // 如果本地没有，则从API获取
    try {
      const user = await api.get<User>('/users/me');
      
      // 更新本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }
      
      return user;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return null;
    }
  }
  
  /**
   * 获取用户的认证令牌
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
  
  /**
   * 检查用户是否已登录
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
  
  /**
   * 更新用户信息
   * @param data 更新的用户数据
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await api.patch<User>('/users/me', data);
    
    // 更新本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    
    return user;
  }
  
  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences> {
    return api.get<UserPreferences>('/users/me/preferences');
  }
  
  /**
   * 更新用户偏好设置
   * @param preferences 更新的偏好设置
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return api.patch<UserPreferences>('/users/me/preferences', preferences);
  }
  
  /**
   * 获取查询历史记录
   * @param options 分页选项
   */
  async getQueryHistory(options?: {
    page?: number;
    limit?: number;
  }): Promise<{
    queries: QueryHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    return api.get('/users/me/history', options);
  }
  
  /**
   * 删除查询历史记录
   * @param queryId 查询ID
   */
  async deleteQueryHistory(queryId: string): Promise<void> {
    await api.delete(`/users/me/history/${queryId}`);
  }
  
  /**
   * 清除所有查询历史记录
   */
  async clearQueryHistory(): Promise<void> {
    await api.delete('/users/me/history');
  }
  
  /**
   * 模拟登录 (仅开发环境使用)
   */
  async mockLogin(email: string): Promise<AuthResponse> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: 'user-123',
      name: email.split('@')[0],
      email,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
    };
    
    const response: AuthResponse = {
      user: mockUser,
      token: `mock-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    // 保存到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
    
    return response;
  }
}

export const userService = new UserService(); 