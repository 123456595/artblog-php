import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import Works from './pages/Works';
import Gallery from './pages/Gallery';
import Now from './pages/Now';
import Tools from './pages/Tools';
import Media from './pages/Media';
import Subscribers from './pages/Subscribers';
import Settings from './pages/Settings';

function Gate() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Loading text="SESSION CHECK" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="admin-body">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Gate />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="posts" element={<Posts />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/:id" element={<PostEditor />} />
                <Route path="works" element={<Works />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="now" element={<Now />} />
                <Route path="tools" element={<Tools />} />
                <Route path="media" element={<Media />} />
                <Route path="subscribers" element={<Subscribers />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </HashRouter>
  );
}
