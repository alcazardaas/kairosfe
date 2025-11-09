import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api/client';
import { trackPageView } from '@/lib/analytics/posthog';
import { FormInput } from '@/components/forms/FormInput';
import type { LeaveRequest } from '@kairos/shared';
import '@/lib/i18n';

const leaveRequestSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal', 'other']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export default function LeaveRequestsContent() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
  });

  useEffect(() => {
    trackPageView('leave-requests');
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await apiClient.get<LeaveRequest[]>('/leave-requests');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LeaveRequestFormData) => {
    try {
      const newRequest = await apiClient.post<LeaveRequest>('/leave-requests', data);
      setRequests([newRequest, ...requests]);
      setShowForm(false);
      reset();
    } catch (error) {
      console.error('Failed to create leave request:', error);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="leave-requests">
      <div className="header">
        <h1>{t('leaveRequests.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {t('leaveRequests.createRequest')}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-field">
                <label>{t('leaveRequests.type')}</label>
                <select {...register('type')}>
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && <span className="form-error">{errors.type.message}</span>}
              </div>
            </div>

            <FormInput
              label={t('leaveRequests.startDate')}
              name="startDate"
              type="date"
              register={register}
              error={errors.startDate}
            />

            <FormInput
              label={t('leaveRequests.endDate')}
              name="endDate"
              type="date"
              register={register}
              error={errors.endDate}
            />

            <FormInput
              label={t('leaveRequests.reason')}
              name="reason"
              register={register}
              error={errors.reason}
            />

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('leaveRequests.submit')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="requests-list">
          {requests.length === 0 ? (
            <p className="empty-state">{t('leaveRequests.noRequests')}</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <h3>{request.type}</h3>
                  <p>
                    {request.startDate} - {request.endDate}
                  </p>
                  {request.reason && <p className="muted">{request.reason}</p>}
                </div>
                <span className={`status-badge status-${request.status}`}>
                  {t(`leaveRequests.${request.status}`)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
