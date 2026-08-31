import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from './AppLayout'
import { HomePage } from '../pages/HomePage'
import { MorePage } from '../pages/MorePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { QrRoutePage } from '../pages/QrRoutePage'
import { ScanPage } from '../pages/ScanPage'
import { TreesPage } from '../pages/TreesPage'
import { WorkPage } from '../pages/WorkPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'work', element: <WorkPage /> },
      { path: 'scan', element: <ScanPage /> },
      { path: 'trees', element: <TreesPage /> },
      { path: 'more', element: <MorePage /> },
      { path: 't/:positionId', element: <QrRoutePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
