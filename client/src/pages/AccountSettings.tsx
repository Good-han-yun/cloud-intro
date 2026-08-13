import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuth } from '../context/AuthContext';

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      alert('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.response?.data?.error || '修改失败');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('确定注销账号？此操作不可恢复！')) return;
    if (!confirm('再次确认：账号注销后所有数据将被永久删除！')) return;
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || '注销失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">账号设置</h1>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
          <h2 className="font-semibold mb-4">账号信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">用户名</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">邮箱</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm card-hover">
          <h2 className="font-semibold mb-4">修改密码</h2>
          <div className="space-y-3">
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="当前密码" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="新密码" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="确认新密码" className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <button onClick={handleChangePassword} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
              修改密码
            </button>
          </div>
        </section>

        <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2">危险操作</h2>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            注销账号后，您的所有数据（个人资料、任务、动态、项目等）将被永久删除且无法恢复。
          </p>
          <button onClick={handleDeleteAccount}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
            注销账号
          </button>
        </section>
      </main>
    </div>
  );
}
