import { Route, Switch } from 'wouter';
import { AdminDataProvider } from './AdminDataProvider';
import { AdminLayout } from './components/AdminLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ContentQueuePage } from './pages/ContentQueuePage';
import { RoadmapPage } from './pages/RoadmapPage';

function AdminApp() {
  // Set admin flag so the main app's LocationCard shows edit buttons
  try { localStorage.setItem('deepmaps-admin', 'true'); } catch { /* SSR guard */ }

  return (
    <AdminDataProvider>
      <AdminLayout>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/queue" component={ContentQueuePage} />
          <Route path="/roadmap" component={RoadmapPage} />
          <Route>
            <div className="text-gray-500 text-sm">Page not found.</div>
          </Route>
        </Switch>
      </AdminLayout>
    </AdminDataProvider>
  );
}

export default AdminApp;
