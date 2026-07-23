import {
  signIn, signOut, getProfile, getActiveTimer,
  getProjects, getTasks, startTimer, stopTimer, getTodayTotal,
} from './api'
import { APP_URL } from './config'
import { WORK_CATEGORIES } from './constants'

const app = document.getElementById('app')!

let timerInterval: ReturnType<typeof setInterval> | null = null

function fmt(h: number) {
  const totalMin = Math.round(h * 60)
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
}

function elapsed(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function render() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }

  const { access_token } = await chrome.storage.local.get('access_token')
  if (!access_token) { renderLogin(); return }

  const [profile, timer, todayTotal, projects] = await Promise.all([
    getProfile(),
    getActiveTimer(),
    getTodayTotal(),
    getProjects(),
  ])

  if (!profile) { renderLogin(); return }

  if (timer) {
    renderRunning(profile, timer, todayTotal, projects)
  } else {
    renderStopped(profile, todayTotal, projects)
  }
}

function renderLogin() {
  app.innerHTML = `
    <div class="header">
      <h1>SE稼働管理</h1>
    </div>
    <div class="login-card">
      <div class="login-title">ログイン</div>
      <form id="loginForm">
        <label>メールアドレス</label>
        <input type="email" name="email" required placeholder="you@example.com" />
        <label>パスワード</label>
        <input type="password" name="password" required />
        <div id="loginError" class="error"></div>
        <button type="submit" class="btn btn-primary" id="loginBtn">ログイン</button>
      </form>
    </div>
  `
  document.getElementById('loginForm')!.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = document.getElementById('loginBtn') as HTMLButtonElement
    const errorEl = document.getElementById('loginError')!
    const fd = new FormData(e.target as HTMLFormElement)
    btn.disabled = true
    btn.textContent = 'ログイン中...'
    errorEl.textContent = ''
    try {
      await signIn(fd.get('email') as string, fd.get('password') as string)
      render()
    } catch (err: any) {
      errorEl.textContent = 'ログインに失敗しました'
      btn.disabled = false
      btn.textContent = 'ログイン'
    }
  })
}

function renderStopped(profile: any, todayTotal: number, projects: any[]) {
  app.innerHTML = `
    <div class="header">
      <h1>SE稼働管理</h1>
      <span class="user">${profile.name}</span>
    </div>
    <div class="summary">
      <div class="summary-card">
        <div class="value">${fmt(todayTotal)}</div>
        <div class="label">本日の合計</div>
      </div>
    </div>
    <div class="timer-card">
      <div class="elapsed stopped">00:00:00</div>
      <div class="timer-meta">タイマー停止中</div>
      <div>
        <label>案件</label>
        <select id="projectSel">
          <option value="">なし</option>
          ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <label>タスク</label>
        <select id="taskSel" disabled>
          <option value="">案件を選択</option>
        </select>
        <button class="btn btn-primary" id="startBtn">▶ タイマー開始</button>
      </div>
    </div>
    <div class="footer">
      <a href="${APP_URL}/dashboard" target="_blank">Webアプリを開く</a>
      <button class="logout-btn" id="logoutBtn">ログアウト</button>
    </div>
  `

  const projectSel = document.getElementById('projectSel') as HTMLSelectElement
  const taskSel = document.getElementById('taskSel') as HTMLSelectElement

  projectSel.addEventListener('change', async () => {
    taskSel.innerHTML = '<option value="">読み込み中...</option>'
    taskSel.disabled = true
    if (!projectSel.value) { taskSel.innerHTML = '<option value="">なし</option>'; return }
    const tasks = await getTasks(projectSel.value)
    taskSel.innerHTML = '<option value="">なし</option>' + tasks.map((t: any) => `<option value="${t.id}">${t.name}</option>`).join('')
    taskSel.disabled = false
  })

  document.getElementById('startBtn')!.addEventListener('click', async () => {
    const btn = document.getElementById('startBtn') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = '開始中...'
    await startTimer(projectSel.value || null, taskSel.value || null)
    render()
  })

  document.getElementById('logoutBtn')!.addEventListener('click', async () => {
    await signOut()
    render()
  })
}

function renderRunning(profile: any, timer: any, todayTotal: number, projects: any[]) {
  const projectName = timer.project?.name ?? '案件なし'
  const taskName = timer.task?.name ?? ''

  app.innerHTML = `
    <div class="header">
      <h1>SE稼働管理</h1>
      <span class="user">${profile.name}</span>
    </div>
    <div class="summary">
      <div class="summary-card">
        <div class="value">${fmt(todayTotal)}</div>
        <div class="label">本日の合計</div>
      </div>
    </div>
    <div class="timer-card">
      <div class="elapsed" id="elapsedDisp">${elapsed(timer.started_at)}</div>
      <div class="timer-meta">
        ${projectName}${taskName ? ' › ' + taskName : ''}
      </div>
      <div class="stop-section">
        <label>稼働分類 *</label>
        <select id="catSel">
          ${WORK_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <label>作業内容</label>
        <input type="text" id="descInput" placeholder="任意" />
        <button class="btn btn-danger" id="stopBtn">■ タイマー停止</button>
      </div>
    </div>
    <div class="footer">
      <a href="${APP_URL}/dashboard" target="_blank">Webアプリを開く</a>
      <button class="logout-btn" id="logoutBtn">ログアウト</button>
    </div>
  `

  timerInterval = setInterval(() => {
    const el = document.getElementById('elapsedDisp')
    if (el) el.textContent = elapsed(timer.started_at)
  }, 1000)

  document.getElementById('stopBtn')!.addEventListener('click', async () => {
    const btn = document.getElementById('stopBtn') as HTMLButtonElement
    const cat = (document.getElementById('catSel') as HTMLSelectElement).value
    const desc = (document.getElementById('descInput') as HTMLInputElement).value
    btn.disabled = true
    btn.textContent = '停止中...'
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    await stopTimer(cat, desc)
    render()
  })

  document.getElementById('logoutBtn')!.addEventListener('click', async () => {
    await signOut()
    render()
  })
}

render()
