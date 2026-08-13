import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import VisitorProfile from './pages/VisitorProfile';
import VisitorDynamics from './pages/VisitorDynamics';
import VisitorDynamicDetail from './pages/VisitorDynamicDetail';
import ProfileSettings from './pages/ProfileSettings';
import TaskManagement from './pages/TaskManagement';
import DynamicManagement from './pages/DynamicManagement';
import ProjectManagement from './pages/ProjectManagement';
import StyleSettings from './pages/StyleSettings';
import AccountSettings from './pages/AccountSettings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/u/:username" element={<VisitorProfile />} />
            <Route path="/u/:username/dynamic" element={<VisitorDynamics />} />
            <Route path="/u/:username/dynamic/:id" element={<VisitorDynamicDetail />} />
            <Route path="/dashboard/profile" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
            <Route path="/dashboard/task" element={<RequireAuth><TaskManagement /></RequireAuth>} />
            <Route path="/dashboard/dynamic" element={<RequireAuth><DynamicManagement /></RequireAuth>} />
            <Route path="/dashboard/project" element={<RequireAuth><ProjectManagement /></RequireAuth>} />
            <Route path="/dashboard/style" element={<RequireAuth><StyleSettings /></RequireAuth>} />
            <Route path="/dashboard/account" element={<RequireAuth><AccountSettings /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Navigate to="/dashboard/profile" replace /></RequireAuth>} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-gray-500">页面不存在</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
