import { useState } from 'react'
import { ArrowLeft, Save, Camera, Check, AlertCircle, X } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — Dedicated page to update operator handle, bio, and avatar.
 */
export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Avatar image must be under 2MB.')
      setTimeout(() => setErrorMsg(''), 3500)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result
      setAvatar(base64)
      setErrorMsg('')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatar(null)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setErrorMsg('Operator handle cannot be empty.')
      return
    }

    setSaving(true)
    setErrorMsg('')

    const updated = {
      ...profile,
      username: username.trim(),
      bio: bio.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    setSaving(false)

    if (result.success) {
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data)
        else onBack()
      }, 1000)
    } else {
      setErrorMsg(result.message || 'Failed to save profile.')
    }
  }

  return (
    <div className="edit-profile-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <section className="masthead">
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Update your public callsign, armory bio, and insignia for field reports and reviews.
        </p>
      </section>

      <div className="edit-profile-card">
        {errorMsg && (
          <div className="alert-box alert-box--danger">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-box alert-box--success">
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="edit-profile-form">
          {/* Avatar Section */}
          <div className="avatar-edit-wrapper">
            <div className="avatar-large-preview">
              {avatar ? (
                <img src={avatar} alt="Avatar Preview" className="avatar-preview-img" />
              ) : (
                <span className="avatar-large-placeholder">
                  {username.charAt(0).toUpperCase() || 'S'}
                </span>
              )}
            </div>

            <div className="avatar-edit-buttons">
              <label className="btn btn--outline btn--sm avatar-upload-label" htmlFor="avatar-file">
                <Camera size={15} /> Upload Photo
              </label>
              <input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />

              {avatar && (
                <button
                  type="button"
                  className="btn btn--subtle btn--sm"
                  onClick={handleRemoveAvatar}
                >
                  <X size={15} /> Remove
                </button>
              )}
              <span className="form-hint">JPG, PNG, or WebP. Max 2MB.</span>
            </div>
          </div>

          <div className="form-divider" />

          {/* Username */}
          <div className="form-field">
            <label className="form-label" htmlFor="profile-username">
              Operator Handle / Callsign
            </label>
            <input
              id="profile-username"
              type="text"
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Shooter, Gunner, SpecOps"
              required
              maxLength={40}
            />
          </div>

          {/* Bio */}
          <div className="form-field">
            <label className="form-label" htmlFor="profile-bio">
              Armory Bio / Qualifications
            </label>
            <textarea
              id="profile-bio"
              className="text-input"
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your shooting background, hardware preferences, or range experience..."
              maxLength={240}
            />
            <span className="form-hint" style={{ textAlign: 'right', display: 'block' }}>
              {bio.length}/240 characters
            </span>
          </div>

          {/* Action buttons */}
          <div className="edit-profile-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Saving Changes…' : 'Save Profile'}
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={onBack}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
