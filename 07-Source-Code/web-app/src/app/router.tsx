import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from './AppLayout'
import { Phase2Provider } from './Phase2Context'
import { RouteLoading } from './RouteLoading'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Phase2Provider />,
    HydrateFallback: RouteLoading,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, lazy: async () => ({ Component: (await import('../pages/HomePage')).HomePage }) },
          { path: 'work', lazy: async () => ({ Component: (await import('../pages/WorkPage')).WorkPage }) },
          { path: 'work/new', lazy: async () => ({ Component: (await import('../pages/WorkCreatePage')).WorkCreatePage }) },
          { path: 'work/:workOrderId', lazy: async () => ({ Component: (await import('../pages/WorkDetailPage')).WorkDetailPage }) },
          { path: 'care', lazy: async () => ({ Component: (await import('../pages/CarePage')).CarePage }) },
          { path: 'disease', lazy: async () => ({ Component: (await import('../pages/DiseasePage')).DiseasePage }) },
          { path: 'disease/:incidentId', lazy: async () => ({ Component: (await import('../pages/DiseasePage')).DiseasePage }) },
          { path: 'disease-analysis-readiness', lazy: async () => ({ Component: (await import('../pages/DiseaseAnalysisReadinessPage')).DiseaseAnalysisReadinessPage }) },
          { path: 'notifications', lazy: async () => ({ Component: (await import('../pages/NotificationsPage')).NotificationsPage }) },
          { path: 'production', lazy: async () => ({ Component: (await import('../pages/ProductionPage')).ProductionPage }) },
          { path: 'inventory', lazy: async () => ({ Component: (await import('../pages/InventoryPage')).InventoryPage }) },
          { path: 'portfolio', lazy: async () => ({ Component: (await import('../pages/PortfolioPage')).PortfolioPage }) },
          { path: 'sync', lazy: async () => ({ Component: (await import('../pages/SyncCenterPage')).SyncCenterPage }) },
          { path: 'scan', lazy: async () => ({ Component: (await import('../pages/ScanPage')).ScanPage }) },
          { path: 'orchard-layout', lazy: async () => ({ Component: (await import('../pages/OrchardLayoutPage')).OrchardLayoutPage }) },
          { path: 'trees', lazy: async () => ({ Component: (await import('../pages/TreesPage')).TreesPage }) },
          { path: 'trees/new', lazy: async () => ({ Component: (await import('../pages/TreeCreatePage')).TreeCreatePage }) },
          { path: 'trees/import', lazy: async () => ({ Component: (await import('../pages/TreeImportPage')).TreeImportPage }) },
          { path: 'trees/:positionId', lazy: async () => ({ Component: (await import('../pages/TreeDetailPage')).TreeDetailPage }) },
          { path: 'more', lazy: async () => ({ Component: (await import('../pages/MorePage')).MorePage }) },
          { path: 'farm-management', lazy: async () => ({ Component: (await import('../pages/FarmManagementPage')).FarmManagementPage }) },
          { path: 'farm-management/new', lazy: async () => ({ Component: (await import('../pages/FarmCreatePage')).FarmCreatePage }) },
          { path: 'farm-management/:farmId', lazy: async () => ({ Component: (await import('../pages/FarmProfilePage')).FarmProfilePage }) },
          { path: 'manual', lazy: async () => ({ Component: (await import('../pages/UserManualPage')).UserManualPage }) },
          { path: 'members', lazy: async () => ({ Component: (await import('../pages/MembersPage')).MembersPage }) },
          { path: 'audit', lazy: async () => ({ Component: (await import('../pages/AuditPage')).AuditPage }) },
          { path: 'farms/:farmId', lazy: async () => ({ Component: (await import('../pages/FarmAccessPage')).FarmAccessPage }) },
          { path: 't/:positionId', lazy: async () => ({ Component: (await import('../pages/QrRoutePage')).QrRoutePage }) },
          ...(import.meta.env.DEV ? [{
            path: 'dev/scenarios',
            lazy: async () => ({ Component: (await import('../pages/DevelopmentMockScenarioPage')).DevelopmentMockScenarioPage }),
          }] : []),
          { path: '*', lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }) },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
