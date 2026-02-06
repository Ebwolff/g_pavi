import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';

export type DashboardTab = 'performance' | 'analitico';

export function useDashboard() {
    const [activeTab, setActiveTab] = useState<DashboardTab>('performance');

    const {
        data: stats,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['dashboard-stats-main'],
        queryFn: () => statsService.getDashboardStats(),
        refetchInterval: 60000,
        retry: 2,
        retryDelay: 3000,
        // Only fetch if we are on the performance tab to save resources
        enabled: activeTab === 'performance',
        staleTime: 30000,
    });

    return {
        activeTab,
        setActiveTab,
        stats,
        isLoading,
        error,
        refetch
    };
}
