import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { emailApi } from '../../services/api';
import { Upload } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [delayMs, setDelayMs] = useState('2000');
  const [hourlyLimit, setHourlyLimit] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = text
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e && e.includes('@'));
      setRecipients(emails);
    };
    reader.readAsText(file);
  };

  const handleSchedule = async () => {
    if (!subject || !body || recipients.length === 0 || !startTime) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await emailApi.scheduleEmails({
        subject,
        body,
        recipients,
        startTime,
        delayMs: parseInt(delayMs),
        hourlyLimit: parseInt(hourlyLimit),
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setRecipients([]);
    setStartTime('');
    setDelayMs('2000');
    setHourlyLimit('100');
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose New Email">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Input
          label="Subject *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body *
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter email body"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Recipients (CSV/TXT) *
          </label>
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <Upload size={20} />
            <span>Choose file</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {recipients.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {recipients.length} recipients loaded
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Input
            label="Delay Between Emails (ms)"
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(e.target.value)}
            min="1000"
          />
        </div>

        <Input
          label="Hourly Limit"
          type="number"
          value={hourlyLimit}
          onChange={(e) => setHourlyLimit(e.target.value)}
          min="1"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Emails'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};