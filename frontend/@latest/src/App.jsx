import { useEffect, useMemo, useState } from 'react'
import {
	ArrowDownToLine, ArrowRight, ArrowUpRight, BadgeCheck, Bell,
	BriefcaseBusiness, Building2, Check, ChevronDown, CircleHelp, Clock3,
	DoorOpen, FileText, Filter, LayoutDashboard, LoaderCircle, LockKeyhole,
	Mail, Menu, Pencil, Plus, Search, Settings2, ShieldCheck,
	Sparkles, Trash2, Users, X,
} from 'lucide-react'

const API_ROOT = import.meta.env.VITE_API_URL || '/api'
const STORAGE_KEY = 'company-archive-session'
const TODAY_LABEL = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

async function request(path, { token, ...options } = {}) {
	const response = await fetch(`${API_ROOT}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	})
	const payload = await response.json().catch(() => ({}))
	if (!response.ok) throw new Error(payload.message || 'Something went wrong. Please try again.')
	return payload
}

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
const shortDate = (value) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—'
const initials = (value = '') => value.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

function App() {
	const [session, setSession] = useState(() => {
		try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
	})
	const [section, setSection] = useState('overview')
	const [companies, setCompanies] = useState([])
	const [employees, setEmployees] = useState([])
	const [company, setCompany] = useState(null)
	const [loading, setLoading] = useState(false)
	const [dataError, setDataError] = useState('')
	const [toast, setToast] = useState('')
	const [query, setQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [modal, setModal] = useState(null)
	const [mobileNav, setMobileNav] = useState(false)

	const isAdmin = session?.user?.role === 'admin'
	const userName = session?.user?.name || 'Workspace owner'

	const notify = (message) => {
		setToast(message)
		window.setTimeout(() => setToast(''), 3200)
	}

	const loadWorkspace = async () => {
		if (!session?.token) return
		setLoading(true)
		setDataError('')
		try {
			if (session.user.role === 'admin') {
				const payload = await request('/admin/companies', { token: session.token })
				setCompanies(payload.companies || [])
			} else {
				const [companyPayload, employeePayload] = await Promise.all([
					request('/company/me', { token: session.token }),
					request('/employees', { token: session.token }),
				])
				setCompany(companyPayload.company)
				setEmployees(employeePayload.employees || [])
			}
		} catch (error) {
			setDataError(error.message)
			if (/not authenticated|expired token/i.test(error.message)) logout()
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { loadWorkspace() }, [session?.token])

	const filteredCompanies = useMemo(() => companies.filter((item) => {
		const matchesStatus = statusFilter === 'all' || item.status === statusFilter
		const value = `${item.name || ''} ${item.industry || ''} ${item.location || ''} ${item.user?.name || ''} ${item.user?.email || ''}`.toLowerCase()
		return matchesStatus && value.includes(query.toLowerCase())
	}), [companies, query, statusFilter])

	const filteredEmployees = useMemo(() => employees.filter((item) => `${item.name} ${item.email} ${item.job_title}`.toLowerCase().includes(query.toLowerCase())), [employees, query])

	function logout() {
		localStorage.removeItem(STORAGE_KEY)
		setSession(null)
		setCompanies([])
		setEmployees([])
		setCompany(null)
		setSection('overview')
	}

	async function updateCompanyStatus(item, status) {
		try {
			await request(`/admin/companies/${item._id}/status`, { token: session.token, method: 'PATCH', body: JSON.stringify({ status }) })
			setCompanies((current) => current.map((entry) => entry._id === item._id ? { ...entry, status } : entry))
			notify(`${item.name} is now ${status}.`)
		} catch (error) { notify(error.message) }
	}

	async function deleteCompany(item) {
		if (!window.confirm(`Permanently delete ${item.name} and all associated data?`)) return
		try {
			await request(`/admin/companies/${item._id}`, { token: session.token, method: 'DELETE' })
			setCompanies((current) => current.filter((entry) => entry._id !== item._id))
			notify(`${item.name} was deleted.`)
		} catch (error) { notify(error.message) }
	}

	async function saveEmployee(form) {
		const editing = Boolean(form._id)
		const { _id, ...body } = form
		try {
			const payload = await request(editing ? `/employees/${_id}` : '/employees', {
				token: session.token,
				method: editing ? 'PATCH' : 'POST',
				body: JSON.stringify({ ...body, salary: Number(body.salary) }),
			})
			setEmployees((current) => editing ? current.map((item) => item._id === _id ? payload.employee : item) : [payload.employee, ...current])
			setModal(null)
			notify(editing ? 'Employee record updated.' : 'Employee added to the archive.')
		} catch (error) { notify(error.message) }
	}

	async function deleteEmployee(item) {
		if (!window.confirm(`Delete ${item.name}'s employee record?`)) return
		try {
			await request(`/employees/${item._id}`, { token: session.token, method: 'DELETE' })
			setEmployees((current) => current.filter((entry) => entry._id !== item._id))
			notify('Employee record deleted.')
		} catch (error) { notify(error.message) }
	}

	async function saveProfile(form) {
		try {
			const payload = await request('/company/me', { token: session.token, method: 'PATCH', body: JSON.stringify(form) })
			setCompany(payload.company)
			setModal(null)
			notify('Company profile saved.')
		} catch (error) { notify(error.message) }
	}

	function exportCsv() {
		const rows = isAdmin ? filteredCompanies : filteredEmployees
		const fields = isAdmin ? ['name', 'industry', 'location', 'status', 'createdAt'] : ['name', 'email', 'job_title', 'salary']
		const csv = [fields.join(','), ...rows.map((row) => fields.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
		const link = document.createElement('a')
		link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
		link.download = isAdmin ? 'company-archive.csv' : 'employee-archive.csv'
		link.click()
		URL.revokeObjectURL(link.href)
	}

	if (!session) return <AuthScreen onLogin={(value) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); setSession(value) }} />

	const navigation = isAdmin
		? [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'companies', label: 'Company archive', icon: Building2 }]
		: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'employees', label: 'Employees', icon: Users }, { id: 'profile', label: 'Company profile', icon: Building2 }]

	return (
		<div className="app-shell">
			{mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
			<aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
				<a className="brand" href="#home" onClick={(event) => event.preventDefault()}>
					<span className="brand-mark"><span /></span>
					<span>Diyya<span className="brand-dot">.</span><small>COMPANY ARCHIVE</small></span>
				</a>
				<div className="workspace-label">WORKSPACE</div>
				<div className="workspace-switcher"><span className="workspace-icon"><Building2 size={16} /></span><span>{isAdmin ? 'Global operations' : company?.name || session.user.companyName || 'My company'}<small>{isAdmin ? 'Administrator' : 'Company workspace'}</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
				<nav className="main-nav" aria-label="Main navigation">
					<p className="nav-caption">MANAGE</p>
					{navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setSection(id); setMobileNav(false) }} className={`nav-link ${section === id ? 'nav-link-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'companies' && <span className="nav-count">{companies.length}</span>}</button>)}
				</nav>
				<div className="sidebar-bottom">
					<div className="sidebar-note"><span className="note-glyph"><Sparkles size={16} /></span><p><b>Every record, in order.</b><span>Your company data, kept clear and current.</span></p></div>
					<button className="nav-link support-link" onClick={() => notify('Contact your workspace administrator for support.')}><CircleHelp size={18} /><span>Help & support</span><ArrowUpRight size={14} /></button>
					<div className="profile-menu"><span className="avatar avatar-user">{initials(userName)}</span><span className="user-meta"><b>{userName}</b><small>{session.user.email}</small></span><button title="Sign out" aria-label="Sign out" className="icon-button profile-logout" onClick={logout}><DoorOpen size={17} /></button></div>
				</div>
			</aside>

			<main className="main-content">
				<header className="topbar">
					<button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
					<div className="breadcrumbs"><span>Workspace</span><ArrowRight size={13} /><b>{navigation.find((item) => item.id === section)?.label || 'Overview'}</b></div>
					<div className="topbar-actions"><span className="secure-label"><ShieldCheck size={15} /> Secure workspace</span><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up.')}><Bell size={18} /><i /></button><span className="avatar avatar-user top-avatar">{initials(userName)}</span></div>
				</header>

				<div className="page-wrap">
					{dataError && <div className="error-banner"><span>{dataError}</span><button onClick={loadWorkspace}>Retry</button></div>}
					{section === 'overview' && <Overview isAdmin={isAdmin} userName={userName} company={company} companies={companies} employees={employees} loading={loading} onNavigate={setSection} onAdd={() => setModal({ type: 'employee' })} />}
					{section === 'companies' && isAdmin && <CompanyArchive companies={filteredCompanies} allCompanies={companies} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} loading={loading} onExport={exportCsv} onStatus={updateCompanyStatus} onDelete={deleteCompany} />}
					{section === 'employees' && !isAdmin && <EmployeeArchive employees={filteredEmployees} query={query} setQuery={setQuery} loading={loading} onExport={exportCsv} onAdd={() => setModal({ type: 'employee' })} onEdit={(item) => setModal({ type: 'employee', item })} onDelete={deleteEmployee} />}
					{section === 'profile' && !isAdmin && <CompanyProfile company={company} employees={employees} onEdit={() => setModal({ type: 'profile', item: company })} />}
					{loading && <div className="loading-indicator"><LoaderCircle size={16} className="spin" /> Syncing workspace data</div>}
				</div>
			</main>

			{modal?.type === 'employee' && <EmployeeModal item={modal.item} onClose={() => setModal(null)} onSave={saveEmployee} />}
			{modal?.type === 'profile' && <ProfileModal item={modal.item} onClose={() => setModal(null)} onSave={saveProfile} />}
			{toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
		</div>
	)
}

function AuthScreen({ onLogin }) {
	const [mode, setMode] = useState('login')
	const [form, setForm] = useState({ name: '', companyName: '', industry: '', location: '', website: '', email: '', password: '' })
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [busy, setBusy] = useState(false)

	async function submit(event) {
		event.preventDefault()
		setError('')
		setNotice('')
		setBusy(true)
		try {
			if (mode === 'signup') {
				const payload = await request('/auth/signup', { method: 'POST', body: JSON.stringify(form) })
				setNotice(payload.message || 'Account created. Your workspace is awaiting approval.')
				setMode('login')
			} else {
				onLogin(await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) }))
			}
		} catch (submissionError) { setError(submissionError.message) }
		finally { setBusy(false) }
	}

	return (
		<div className="auth-layout">
			<div className="auth-left">
				<a className="brand auth-brand" href="#home"><span className="brand-mark"><span /></span><span>Diyya<span className="brand-dot">.</span><small>COMPANY ARCHIVE</small></span></a>
				<div className="auth-copy"><span className="eyebrow"><span className="eyebrow-dot" /> A CLEARER WAY TO KEEP COMPANY</span><h1>Good records.<br /><em>Better business.</em></h1><p>A considered home for your company information and the people who make it work.</p><div className="auth-proof"><span className="proof-icon"><FileText size={17} /></span><span><b>One dependable record</b><small>Company details and employee records, together.</small></span><ArrowUpRight size={16} /></div></div>
				<div className="auth-left-footer"><span>DIYYA / EST. FOR THE LONG RUN</span><span>01 — 02</span></div>
			</div>
			<div className="auth-right">
				<div className="auth-topline"><span>Already have a workspace?</span><button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}>{mode === 'login' ? 'Create account' : 'Sign in'} <ArrowRight size={15} /></button></div>
				<div className="auth-form-wrap"><div className="auth-form-heading"><span className="form-kicker">{mode === 'login' ? 'WELCOME BACK' : 'START YOUR WORKSPACE'}</span><h2>{mode === 'login' ? 'Sign in to Diyya' : 'Create your account'}</h2><p>{mode === 'login' ? 'Pick up right where your records are.' : 'Your company archive starts here.'}</p></div>
					{error && <div className="form-alert">{error}</div>}{notice && <div className="form-success"><Check size={16} />{notice}</div>}
					<form className="auth-form" onSubmit={submit}>
						{mode === 'signup' && <>
							<label>Your name<input required autoComplete="name" placeholder="Jordan Lee" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
							<label>Company name<input required autoComplete="organization" placeholder="Northstar Studio" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
							<label>Industry (optional)<input autoComplete="organization-title" placeholder="Design & technology" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label>
							<label>Location (optional)<input autoComplete="address-level2" placeholder="Portland, Oregon" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
							<label>Company website (optional)<input type="url" autoComplete="url" placeholder="https://company.com" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
							<p className="signup-details-note">You can add or update these details later in your company profile.</p>
						</>}
						<label>Work email<span className="input-wrap"><Mail size={16} /><input required type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span></label>
						<label>Password<span className="input-wrap"><LockKeyhole size={16} /><input required type="password" minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></span></label>
						{mode === 'login' && <div className="form-helper"><span><span className="tiny-lock"><LockKeyhole size={11} /></span> Your data stays yours</span><span>Protected access</span></div>}
						<button className="primary-button auth-submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : mode === 'login' ? 'Sign in' : 'Create company account'}<ArrowRight size={16} /></button>
					</form><div className="auth-footnote"><ShieldCheck size={15} /> Secure sign-in, built around your company.</div>
				</div><footer className="auth-right-footer"><span>© 2026 DIYYA ARCHIVE</span><span>PRIVACY&nbsp;&nbsp; · &nbsp;&nbsp;TERMS</span></footer>
			</div>
		</div>
	)
}

function Overview({ isAdmin, userName, company, companies, employees, loading, onNavigate, onAdd }) {
	const activeCount = companies.filter((item) => item.status === 'active').length
	const pendingCount = companies.filter((item) => item.status === 'pending').length
	const averageSalary = employees.length ? employees.reduce((total, item) => total + Number(item.salary || 0), 0) / employees.length : 0
	const recentItems = isAdmin ? companies.slice(0, 5) : employees.slice(0, 5)

	return <section className="page-section page-enter">
		<div className="page-heading"><div><div className="date-line"><span className="date-marker" /> {TODAY_LABEL}</div><h1>{isAdmin ? 'Good morning' : `Welcome back${userName.split(' ')[0] ? `, ${userName.split(' ')[0]}` : ''}`}<span className="heading-period">.</span></h1><p>{isAdmin ? 'Here’s the latest across your company archive.' : `A clear view of ${company?.name || 'your company'} and its people.`}</p></div><div className="heading-actions">{isAdmin ? <button className="secondary-button" onClick={() => onNavigate('companies')}><Building2 size={16} /> Browse companies</button> : <button className="primary-button" onClick={onAdd}><Plus size={17} /> Add employee</button>}</div></div>
		<div className="stat-grid">
			{isAdmin ? <><StatCard icon={Building2} label="Total companies" value={companies.length} detail="Across the archive" tone="mint" /><StatCard icon={BadgeCheck} label="Active companies" value={activeCount} detail={companies.length ? `${Math.round(activeCount / companies.length * 100)}% of all accounts` : 'No approved accounts yet'} tone="green" /><StatCard icon={Clock3} label="Awaiting review" value={pendingCount} detail={pendingCount ? 'Needs your attention' : 'All caught up'} tone="yellow" /></> : <><StatCard icon={Users} label="People on record" value={employees.length} detail="Current employee records" tone="mint" /><StatCard icon={BriefcaseBusiness} label="Annual payroll" value={money(averageSalary * employees.length * 12)} detail="Based on current records" tone="green" /><StatCard icon={Building2} label="Workspace status" value={company?.status || '—'} detail={company?.industry || 'Company profile'} tone="yellow" valueStyle="capitalize" /></>}
		</div>
		<div className="overview-grid">
			<div className="panel activity-panel"><div className="panel-head"><div><span className="panel-kicker">{isAdmin ? 'LATEST IN THE ARCHIVE' : 'PEOPLE DIRECTORY'}</span><h2>{isAdmin ? 'Recent companies' : 'Employee records'}</h2></div><button className="text-action" onClick={() => onNavigate(isAdmin ? 'companies' : 'employees')}>View all <ArrowRight size={14} /></button></div>
				{recentItems.length ? <div className="compact-list">{recentItems.map((item) => <div className="compact-row" key={item._id}><span className={`avatar ${isAdmin ? 'avatar-company' : 'avatar-employee'}`}>{initials(isAdmin ? item.name : item.name)}</span><div className="compact-name"><b>{item.name}</b><small>{isAdmin ? item.industry || 'Industry not set' : item.job_title}</small></div>{isAdmin ? <StatusBadge status={item.status} /> : <span className="compact-date">{money(item.salary)}</span>}<span className="row-date">{shortDate(item.createdAt)}</span></div>)}</div> : <EmptyState icon={isAdmin ? Building2 : Users} title={loading ? 'Loading records' : 'Nothing here yet'} description={isAdmin ? 'Company registrations will appear here.' : 'Add your first employee to start the directory.'} />}
			</div>
			<div className="panel right-panel"><div className="panel-head"><div><span className="panel-kicker">WORKSPACE SNAPSHOT</span><h2>{isAdmin ? 'Review queue' : 'Company details'}</h2></div><span className="panel-icon"><Settings2 size={17} /></span></div>{isAdmin ? <><div className="queue-number">{pendingCount}<span>companies to review</span></div><p className="queue-copy">Review company registrations and keep the archive current.</p><button className="queue-link" onClick={() => onNavigate('companies')}>Open review queue <ArrowRight size={15} /></button><div className="queue-foot"><span className="status-dot status-pending-dot" /> {pendingCount ? `${pendingCount} awaiting your review` : 'No pending reviews'}</div></> : <><div className="company-mini"><span className="company-initials">{initials(company?.name || 'CO')}</span><div><b>{company?.name || 'Your company'}</b><small>{company?.industry || 'Industry not added'}</small></div><button className="icon-button" onClick={() => onNavigate('profile')} aria-label="View company profile"><ArrowUpRight size={17} /></button></div><div className="mini-detail"><span>Workspace status</span><StatusBadge status={company?.status || 'pending'} /></div><div className="mini-detail"><span>Location</span><b>{company?.location || 'Not added'}</b></div><button className="queue-link" onClick={() => onNavigate('profile')}>View company profile <ArrowRight size={15} /></button></>}</div>
		</div>
		<div className="overview-footer"><span><ShieldCheck size={15} /> Your archive is private to this workspace.</span><span>Last synced just now</span></div>
	</section>
}

function StatCard({ icon: Icon, label, value, detail, tone, valueStyle = '' }) {
	return <div className={`stat-card stat-${tone}`}><div className="stat-top"><span className="stat-icon"><Icon size={18} strokeWidth={1.8} /></span><span className="stat-label">{label}</span><ArrowUpRight size={15} className="stat-arrow" /></div><div className={`stat-value ${valueStyle}`}>{value}</div><div className="stat-detail">{detail}</div><span className="stat-accent" /></div>
}

function CompanyArchive({ companies, allCompanies, query, setQuery, statusFilter, setStatusFilter, loading, onExport, onStatus, onDelete }) {
	const counts = ['all', 'pending', 'active', 'suspended'].reduce((result, status) => ({ ...result, [status]: status === 'all' ? allCompanies.length : allCompanies.filter((item) => item.status === status).length }), {})
	return <section className="page-section page-enter"><div className="page-heading"><div><div className="date-line"><span className="date-marker" /> ADMINISTRATION / RECORDS</div><h1>Company archive<span className="heading-period">.</span></h1><p>Review registrations and manage every company in the archive.</p></div><button className="secondary-button" onClick={onExport}><ArrowDownToLine size={16} /> Export CSV</button></div>
		<div className="archive-summary"><div><span className="summary-big">{allCompanies.length}</span><span className="summary-label">registered companies</span></div><span className="summary-separator" /><div className="summary-mini"><span className="status-dot status-pending-dot" /> {counts.pending} pending review</div><div className="summary-mini"><span className="status-dot status-active-dot" /> {counts.active} active</div><div className="summary-mini"><span className="status-dot status-suspended-dot" /> {counts.suspended} suspended</div></div>
		<div className="archive-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by status">{['all', 'pending', 'active', 'suspended'].map((status) => <button key={status} className={statusFilter === status ? 'filter-tab selected' : 'filter-tab'} onClick={() => setStatusFilter(status)}>{status === 'all' ? 'All companies' : status[0].toUpperCase() + status.slice(1)}<span>{counts[status]}</span></button>)}</div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies..." /><kbd>⌘ K</kbd></label></div>
		<div className="table-frame"><div className="table-scroll"><table><thead><tr><th>COMPANY</th><th>OWNER</th><th>INDUSTRY / LOCATION</th><th>REGISTERED</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{companies.map((item, index) => <tr key={item._id} style={{ animationDelay: `${index * 35}ms` }}><td><div className="table-company"><span className="avatar avatar-company">{initials(item.name)}</span><span><b>{item.name}</b><small>{item.website || item.user?.email || 'Website not added'}</small></span></div></td><td><span className="owner-name">{item.user?.name || '—'}</span><small className="owner-email">{item.user?.email || ''}</small></td><td><span>{item.industry || 'Not specified'}</span><small className="owner-email">{item.location || 'Location not added'}</small></td><td>{shortDate(item.createdAt)}</td><td><StatusBadge status={item.status} /></td><td><div className="table-actions">{item.status === 'pending' && <button title="Approve company" aria-label={`Approve ${item.name}`} className="action-button approve-action" onClick={() => onStatus(item, 'active')}><Check size={15} /></button>}{item.status === 'active' && <button title="Suspend company" aria-label={`Suspend ${item.name}`} className="action-button" onClick={() => onStatus(item, 'suspended')}><LockKeyhole size={14} /></button>}{item.status === 'suspended' && <button title="Reactivate company" aria-label={`Reactivate ${item.name}`} className="action-button approve-action" onClick={() => onStatus(item, 'active')}><Check size={15} /></button>}<button title="Delete company" aria-label={`Delete ${item.name}`} className="action-button danger-action" onClick={() => onDelete(item)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>{companies.length === 0 && <EmptyState icon={Filter} title={loading ? 'Loading the archive' : 'No companies found'} description={query ? 'Try adjusting your search or filters.' : 'New company registrations will appear here.'} />}</div>
		<div className="table-foot"><span>Showing <b>{companies.length}</b> of <b>{allCompanies.length}</b> companies</span><span>Company data is confidential <ShieldCheck size={14} /></span></div>
	</section>
}

function EmployeeArchive({ employees, query, setQuery, loading, onExport, onAdd, onEdit, onDelete }) {
	const totalPayroll = employees.reduce((total, item) => total + Number(item.salary || 0), 0)
	return <section className="page-section page-enter"><div className="page-heading"><div><div className="date-line"><span className="date-marker" /> PEOPLE / DIRECTORY</div><h1>Employee records<span className="heading-period">.</span></h1><p>A current, considered record of the people at your company.</p></div><div className="heading-actions"><button className="secondary-button" onClick={onExport}><ArrowDownToLine size={16} /> Export CSV</button><button className="primary-button" onClick={onAdd}><Plus size={17} /> Add employee</button></div></div>
		<div className="archive-summary"><div><span className="summary-big">{employees.length}</span><span className="summary-label">people on record</span></div><span className="summary-separator" /><div className="summary-mini"><Users size={15} /> {employees.length} employee records</div><div className="summary-mini"><BriefcaseBusiness size={15} /> {money(totalPayroll)} monthly salary total</div></div>
		<div className="archive-toolbar employee-toolbar"><span className="toolbar-title">ALL EMPLOYEES <span>{employees.length}</span></span><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people..." /><kbd>⌘ K</kbd></label></div>
		<div className="table-frame"><div className="table-scroll"><table className="employee-table"><thead><tr><th>EMPLOYEE</th><th>JOB TITLE</th><th>EMAIL ADDRESS</th><th>MONTHLY SALARY</th><th>ADDED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{employees.map((item, index) => <tr key={item._id} style={{ animationDelay: `${index * 35}ms` }}><td><div className="table-company"><span className={`avatar employee-color-${index % 4}`}>{initials(item.name)}</span><b>{item.name}</b></div></td><td>{item.job_title}</td><td>{item.email}</td><td className="salary-cell">{money(item.salary)}</td><td>{shortDate(item.createdAt)}</td><td><div className="table-actions"><button title="Edit employee" aria-label={`Edit ${item.name}`} className="action-button" onClick={() => onEdit(item)}><Pencil size={14} /></button><button title="Delete employee" aria-label={`Delete ${item.name}`} className="action-button danger-action" onClick={() => onDelete(item)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>{employees.length === 0 && <EmptyState icon={Users} title={loading ? 'Loading employee records' : query ? 'No matching employees' : 'Your directory is ready'} description={query ? 'Try another name, email or job title.' : 'Add your first employee record to get started.'} action={!query && !loading ? <button className="secondary-button" onClick={onAdd}><Plus size={15} /> Add first employee</button> : null} />}</div>
		<div className="table-foot"><span>Showing <b>{employees.length}</b> employee records</span><span>Private to {employees.length ? 'your company' : 'this workspace'} <ShieldCheck size={14} /></span></div>
	</section>
}

function CompanyProfile({ company, employees, onEdit }) {
	return <section className="page-section page-enter"><div className="page-heading"><div><div className="date-line"><span className="date-marker" /> WORKSPACE / SETTINGS</div><h1>Company profile<span className="heading-period">.</span></h1><p>Your company's identity and archive details.</p></div><button className="primary-button" onClick={onEdit}><Pencil size={15} /> Edit profile</button></div>
		<div className="profile-layout"><div className="panel profile-identity"><span className="profile-logo">{initials(company?.name || 'CO')}</span><div className="identity-name"><h2>{company?.name || 'Your company'}</h2><p>{company?.industry || 'Industry not specified'} <span>·</span> {company?.location || 'Location not specified'}</p></div><StatusBadge status={company?.status || 'pending'} /><div className="identity-divider" /><div className="identity-description"><span className="panel-kicker">ABOUT THE COMPANY</span><p>{company?.description || 'Add a short description to introduce your company.'}</p></div><a className="website-link" href={company?.website?.startsWith('http') ? company.website : `https://${company?.website || ''}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15} /> {company?.website || 'Add your company website'}</a></div>
			<div className="profile-side"><div className="panel profile-info"><div className="panel-head"><div><span className="panel-kicker">COMPANY DETAILS</span><h2>Archive information</h2></div><FileText size={18} /></div><InfoRow label="Company name" value={company?.name} /><InfoRow label="Industry" value={company?.industry} /><InfoRow label="Location" value={company?.location} /><InfoRow label="Website" value={company?.website} /><InfoRow label="Added to archive" value={shortDate(company?.createdAt)} /></div><div className="profile-count"><span className="profile-count-icon"><Users size={17} /></span><div><b>{employees.length} employee records</b><small>Managed in your people directory</small></div><ArrowRight size={16} /></div></div>
		</div></section>
}

function InfoRow({ label, value }) { return <div className="info-row"><span>{label}</span><b>{value || 'Not added'}</b></div> }

function StatusBadge({ status = 'pending' }) {
	const labels = { active: 'Active', pending: 'Pending', suspended: 'Suspended' }
	return <span className={`status-badge badge-${status}`}><i />{labels[status] || status}</span>
}

function EmptyState({ icon: Icon, title, description, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={20} /></span><h3>{title}</h3><p>{description}</p>{action}</div> }

function EmployeeModal({ item, onClose, onSave }) {
	const [form, setForm] = useState({ name: item?.name || '', email: item?.email || '', job_title: item?.job_title || '', salary: item?.salary || '' })
	function submit(event) { event.preventDefault(); onSave({ ...form, ...(item?._id ? { _id: item._id } : {}) }) }
	return <ModalFrame onClose={onClose} title={item ? 'Edit employee record' : 'Add employee'} description={item ? 'Keep this company record up to date.' : 'Add a person to your company archive.'}><form className="modal-form" onSubmit={submit}><label>Full name<input autoFocus required placeholder="Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input required type="email" placeholder="alex@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Job title<input required placeholder="Operations lead" value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} /></label><label>Monthly salary <span className="field-hint">USD</span><div className="salary-input"><span>$</span><input required type="number" min="0" step="100" placeholder="6,500" value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></div></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Check size={16} /> {item ? 'Save changes' : 'Add employee'}</button></div></form></ModalFrame>
}

function ProfileModal({ item, onClose, onSave }) {
	const [form, setForm] = useState({ name: item?.name || '', description: item?.description || '', website: item?.website || '', location: item?.location || '', industry: item?.industry || '' })
	function submit(event) { event.preventDefault(); onSave(form) }
	return <ModalFrame onClose={onClose} title="Edit company profile" description="A few details help keep your archive complete."><form className="modal-form" onSubmit={submit}><label>Company name<input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Industry<input placeholder="Design & technology" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label><label>Location<input placeholder="Portland, Oregon" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Website<input type="url" placeholder="https://company.com" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label><label>Company description<textarea rows="3" placeholder="A short introduction to your company..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Check size={16} /> Save profile</button></div></form></ModalFrame>
}

function ModalFrame({ onClose, title, description, children }) {
	useEffect(() => { const handleKey = (event) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey) }, [onClose])
	return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="form-kicker">DIYYA / RECORDS</span><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>{children}</section></div>
}

export default App
