import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

chrome.alarms.create('tick', { periodInMinutes: 1 / 60 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'tick') return

  const { access_token, user_id } = await chrome.storage.local.get(['access_token', 'user_id'])
  if (!access_token) {
    chrome.action.setBadgeText({ text: '' })
    return
  }
  if (!user_id) return

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_timers?user_id=eq.${user_id}&select=started_at`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${access_token}`,
        },
      },
    )
    const data = await res.json()
    if (!data?.[0]?.started_at) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    const elapsed = Date.now() - new Date(data[0].started_at).getTime()
    const hours = Math.floor(elapsed / 3600000)
    const minutes = Math.floor((elapsed % 3600000) / 60000)
    const badge = hours > 0 ? `${hours}h` : `${minutes}m`
    chrome.action.setBadgeText({ text: badge })
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' })
  } catch {
    // ignore
  }
})
