import { useState, useEffect } from 'react';

export interface Company {
  name: string;
  code: string;
  industry: string;
}

export interface Industry {
  name: string;
  subIndustries: string[];
}

interface UseSearchDataReturn {
  companies: Company[];
  industries: Industry[];
  isSearchDataLoading: boolean;
  searchError: string | null;
}

export function useSearchData(): UseSearchDataReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isSearchDataLoading, setIsSearchDataLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSearchDataLoading(true);
        
        // 使用真实的 API 调用
        const [companiesRes, industriesRes] = await Promise.all([
          fetch('/api/search/companies'),
          fetch('/api/search/industries')
        ]);
        
        if (!companiesRes.ok || !industriesRes.ok) {
          throw new Error('获取数据失败');
        }
        
        const [companiesData, industriesData] = await Promise.all([
          companiesRes.json(),
          industriesRes.json()
        ]);
        
        setCompanies(companiesData);
        setIndustries(industriesData);
        setSearchError(null);
      } catch (err) {
        console.error('搜索数据加载失败:', err);
        setSearchError(err instanceof Error ? err.message : '获取数据失败');
        
        // 设置默认空数据，防止 UI 崩溃
        setCompanies([]);
        setIndustries([]);
      } finally {
        setIsSearchDataLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    companies,
    industries,
    isSearchDataLoading,
    searchError
  };
} 