import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export default function ProfileDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.browse.get(id)
      .then(setProfile)
      .catch(() => navigate('/browse'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const sendRequest = async () => {
    if (!id) return;
    setSending(true);
    try {
      await api.requests.send({ profileId: id, message });
      alert('تم إرسال طلب التواصل');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/browse')} className="text-[#6B7280] hover:text-[#1B4332] mb-4 block">
        ← {t('common.back')}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        {profile.photos?.[0] && (
          <img src={profile.photos[0].url} alt="" className="w-full h-64 object-cover" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4332]">{profile.displayName}</h1>
              <p className="text-[#6B7280]">
                {profile.age} سنة • {profile.nationality}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[#6B7280]">المدينة</p>
              <p className="font-medium">{profile.city}, {profile.countryOfResidence}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">المهنة</p>
              <p className="font-medium">{profile.occupation}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">التعليم</p>
              <p className="font-medium">{profile.education}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">المذهب</p>
              <p className="font-medium">{t(`profile.madhab.${profile.madhab}`)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-[#1B4332] mb-2">التعريف الذاتي</h3>
            <p className="text-[#4A4A4A] leading-relaxed">{profile.selfIntroduction}</p>
          </div>

          {profile.additionalNotes && (
            <div className="mb-6">
              <h3 className="font-semibold text-[#1B4332] mb-2">ملاحظات إضافية</h3>
              <p className="text-[#4A4A4A]">{profile.additionalNotes}</p>
            </div>
          )}

          <div className="border-t border-[#E5E7EB] pt-6">
            <h3 className="font-semibold text-[#1B4332] mb-4">إرسال طلب تواصل</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg h-24 mb-3"
              placeholder="اكتب رسالة تعريفية..."
            />
            <button
              onClick={sendRequest}
              disabled={sending}
              className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50"
            >
              {sending ? t('common.loading') : t('browse.sendRequest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
