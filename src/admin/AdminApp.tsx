import { Route, Switch } from 'wouter';
import { AdminDataProvider } from './AdminDataProvider';
import { AdminLayout } from './components/AdminLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ContentQueuePage } from './pages/ContentQueuePage';

function RoadmapPlaceholder() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-bold text-gray-200 mb-4">Roadmap</h1>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-8 text-center text-gray-500 text-sm">
        Roadmap page coming in Phase 2.
      </div>
    </div>
  );
}

function AdminApp() {
  return (
    <AdminDataProvider>
      <AdminLayout>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/queue" component={ContentQueuePage} />
          <Route path="/roadmap" component={RoadmapPlaceholder} />
          <Route>
            <div className="text-gray-500 text-sm">Page not found.</div>
          </Route>
        </Switch>
      </AdminLayout>
    </AdminDataProvider>
  );
}

export default AdminApp;
