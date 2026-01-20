import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { ComposeModal } from '../components/Email/ComposeModal';
import { EmailTable } from '../components/Email/EmailTable';
import { Button } from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';
import { emailApi } from '../services/api';
import type { Email } from '../types';
import { Plus } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadEmails();
  }, [user, navigate]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const [scheduled, sent] = await Promise.all([
        emailApi.getScheduledEmails(),
        emailApi.getSentEmails(),
      ]);
      setScheduledEmails(scheduled);
      setSentEmails(sent);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Scheduled Emails
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sent Emails
            </button>
          </div>

          <Button onClick={() => setIsComposeModalOpen(true)}>
            <div className="flex items-center gap-2">
              <Plus size={20} />
              Compose New Email
            </div>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <EmailTable
            emails={activeTab === 'scheduled' ? scheduledEmails : sentEmails}
            type={activeTab}
            loading={loading}
          />
        </div>
      </main>

      <ComposeModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        onSuccess={loadEmails}
      />
    </div>
  );
};