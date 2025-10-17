import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api/client';
import { trackPageView } from '@/lib/analytics/posthog';
import type { TeamMember } from '@kairos/shared';
import '@/lib/i18n';

export default function TeamManagementContent() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('team-management');
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const data = await apiClient.get<TeamMember[]>('/team');
      setMembers(data);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="team-management">
      <h1>{t('team.title')}</h1>

      <div className="card">
        <input
          type="search"
          placeholder={t('team.search')}
          className="search-input"
        />

        <div className="team-list">
          {members.map((member) => (
            <div key={member.id} className="team-member">
              <div className="team-member__info">
                <h3>{member.name}</h3>
                <p>{member.email}</p>
                {member.department && <span className="badge">{member.department}</span>}
              </div>
              <div className="team-member__role">{member.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
