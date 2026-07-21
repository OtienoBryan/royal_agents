import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agentApi } from '../../services/agentApi'
import { Settings as SettingsIcon, User, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

const fld = 'w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white'
const label = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1'

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth()

  // ── Profile form ──────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ── Password form ─────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setContact(user.contact || '')
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setSavingProfile(true)
    try {
      await agentApi.updateProfile({ name, contact })
      await refreshUser()
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' })
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New password and confirmation do not match.' })
      return
    }
    setSavingPassword(true)
    try {
      await agentApi.changePassword(currentPassword, newPassword)
      setPasswordMsg({ type: 'ok', text: 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordMsg({ type: 'err', text: err.message || 'Failed to change password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const Banner: React.FC<{ msg: { type: 'ok' | 'err'; text: string } | null }> = ({ msg }) => {
    if (!msg) return null
    const ok = msg.type === 'ok'
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium ${
        ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        {ok ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
        {msg.text}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-3">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <SettingsIcon className="h-4 w-4" style={{ color: '#1c2e61' }} />Settings
        </h1>
        <p className="text-[11px] text-gray-500 mt-0.5">Manage your profile details and password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-4xl">
        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <User className="h-3.5 w-3.5" style={{ color: '#1c2e61' }} />
            <h2 className="text-[12px] font-bold text-gray-900">Profile Details</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className={label}>Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className={fld} />
            </div>
            <div>
              <label className={label}>Email</label>
              <div className="px-2.5 py-1.5 text-[12px] border border-gray-100 rounded-md bg-gray-50 text-gray-500">
                {user?.email || '—'}
              </div>
            </div>
            <div>
              <label className={label}>Contact</label>
              <input type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="+255 700 000 000" className={fld} />
            </div>
            <div>
              <label className={label}>Agency</label>
              <div className="px-2.5 py-1.5 text-[12px] border border-gray-100 rounded-md bg-gray-50 text-gray-500">
                {(user as any)?.agency?.name || '—'}
              </div>
            </div>

            <Banner msg={profileMsg} />

            <button type="submit" disabled={savingProfile}
              className="w-full px-3 py-1.5 text-[12px] font-semibold rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#1c2e61' }}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Lock className="h-3.5 w-3.5" style={{ color: '#1c2e61' }} />
            <h2 className="text-[12px] font-bold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className={label}>Current Password *</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={fld} autoComplete="current-password" />
            </div>
            <div>
              <label className={label}>New Password *</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className={fld} autoComplete="new-password" />
              <p className="text-[10px] text-gray-400 mt-0.5">At least 6 characters.</p>
            </div>
            <div>
              <label className={label}>Confirm New Password *</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className={fld} autoComplete="new-password" />
            </div>

            <Banner msg={passwordMsg} />

            <button type="submit" disabled={savingPassword}
              className="w-full px-3 py-1.5 text-[12px] font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {savingPassword ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings
