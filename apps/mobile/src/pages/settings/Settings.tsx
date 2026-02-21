import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { checkHealth } from '../../lib/api'
import {
  getApiUrl,
  getAppInstanceId,
  getLastSyncAt,
  getSyncSecret,
  setApiUrl,
  setSyncSecret,
} from '../../lib/credentials'

// ── Types ─────────────────────────────────────────────────

interface SettingsData {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  ie: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  telefone1: string
  telefone2: string
  costMethod: 'FIFO' | 'AVERAGE'
  defaultPriceTierId: string
  bluetoothPrinterName: string
  pcPrinterName: string
  defaultPrintFormat: '60mm' | '80mm' | 'A5' | 'PDF'
}

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'disconnected'

// ── Helpers ───────────────────────────────────────────────

function loadSettings(): SettingsData {
  const stored = localStorage.getItem('spid_settings')
  const defaults: SettingsData = {
    razaoSocial: '', nomeFantasia: '', cnpj: '', ie: '',
    endereco: '', cidade: '', uf: '', cep: '', telefone1: '', telefone2: '',
    costMethod: 'FIFO', defaultPriceTierId: '',
    bluetoothPrinterName: '', pcPrinterName: '',
    defaultPrintFormat: '80mm',
  }
  if (!stored) return defaults

  try {
    return { ...defaults, ...JSON.parse(stored) }
  } catch {
    return defaults
  }
}

function saveSettingsToStorage(data: SettingsData): void {
  localStorage.setItem('spid_settings', JSON.stringify(data))
}

// ── Styles ────────────────────────────────────────────────

const PAGE: CSSProperties = {
  padding: 'var(--sp-4)', paddingBottom: '96px',
  display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)',
}
const SECTION: CSSProperties = {
  backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border)',
  display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
}
const SECTION_TITLE: CSSProperties = {
  fontSize: 'var(--font-sm)', fontWeight: 600,
  color: 'var(--text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const LABEL: CSSProperties = {
  fontSize: 'var(--font-xs)', fontWeight: 500,
  color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block',
}
const INPUT: CSSProperties = {
  width: '100%', padding: 'var(--sp-2) var(--sp-3)',
  fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)',
  borderRadius: 'var(--radius-md)', outline: 'none',
  backgroundColor: 'var(--surface)', minHeight: '44px',
}
const INPUT_READONLY: CSSProperties = {
  ...INPUT, backgroundColor: 'var(--neutral-100)', color: 'var(--text-muted)',
}
const RADIO_GROUP: CSSProperties = { display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }
const STATUS_DOT = (connected: boolean): CSSProperties => ({
  width: 8, height: 8, borderRadius: '50%',
  backgroundColor: connected ? 'var(--success-500, #22c55e)' : 'var(--danger-500, #ef4444)',
  display: 'inline-block', marginRight: 'var(--sp-1)',
})
const INPUT_WITH_BTN: CSSProperties = {
  display: 'flex', gap: 'var(--sp-2)', alignItems: 'stretch',
}

function radioStyle(active: boolean): CSSProperties {
  return {
    padding: 'var(--sp-2) var(--sp-3)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    backgroundColor: active ? 'var(--primary-50)' : 'var(--surface)',
    color: active ? 'var(--primary-700)' : 'var(--text-secondary)',
    fontWeight: 500, fontSize: 'var(--font-sm)', cursor: 'pointer',
    minHeight: '40px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all var(--transition-fast)',
    flex: '1 0 auto',
  }
}

// ── Component ─────────────────────────────────────────────

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const [saved, setSaved] = useState(false)

  // Sync-related state (separate from settings)
  const [syncSecret, setSyncSecretLocal] = useState(getSyncSecret)
  const [apiUrl, setApiUrlLocal] = useState(getApiUrl)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [healthMessage, setHealthMessage] = useState('')
  const [secretSaved, setSecretSaved] = useState(false)
  const [urlSaved, setUrlSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const appInstanceId = getAppInstanceId()
  const lastSync = getLastSyncAt()

  // Check connection on mount
  useEffect(() => {
    handleTestConnection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus('checking')
    setHealthMessage('')
    const result = await checkHealth()
    setConnectionStatus(result.ok ? 'connected' : 'disconnected')
    setHealthMessage(
      result.ok
        ? `Conectado (${result.latencyMs}ms)`
        : result.message,
    )
  }, [])

  function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveSettingsToStorage(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopyInstanceId() {
    navigator.clipboard.writeText(appInstanceId).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSaveSyncSecret() {
    setSyncSecret(syncSecret)
    setSecretSaved(true)
    setTimeout(() => setSecretSaved(false), 2000)
  }

  function handleSaveApiUrl() {
    setApiUrl(apiUrl)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 2000)
    // Re-test connection with new URL
    setTimeout(() => handleTestConnection(), 100)
  }

  function handleSyncNow() {
    // Dispatch custom event that can be caught by a sync engine listener
    window.dispatchEvent(new CustomEvent('spid:sync-now'))
  }

  return (
    <div style={PAGE} className="animate-fade-in">
      {/* Dados do Cupom */}
      <div style={SECTION}>
        <span style={SECTION_TITLE}>Dados do Cupom</span>
        <div>
          <label style={LABEL}>Razao Social</label>
          <input style={INPUT} value={settings.razaoSocial} onChange={(e) => update('razaoSocial', e.target.value)} />
        </div>
        <div>
          <label style={LABEL}>Nome Fantasia</label>
          <input style={INPUT} value={settings.nomeFantasia} onChange={(e) => update('nomeFantasia', e.target.value)} />
        </div>
        <div className="form-row">
          <div>
            <label style={LABEL}>CNPJ</label>
            <input style={INPUT} value={settings.cnpj} onChange={(e) => update('cnpj', e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label style={LABEL}>IE</label>
            <input style={INPUT} value={settings.ie} onChange={(e) => update('ie', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={LABEL}>Endereco</label>
          <input style={INPUT} value={settings.endereco} onChange={(e) => update('endereco', e.target.value)} />
        </div>
        <div className="form-row">
          <div>
            <label style={LABEL}>Cidade</label>
            <input style={INPUT} value={settings.cidade} onChange={(e) => update('cidade', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
            <div>
              <label style={LABEL}>UF</label>
              <input style={INPUT} value={settings.uf} onChange={(e) => update('uf', e.target.value)} maxLength={2} />
            </div>
            <div>
              <label style={LABEL}>CEP</label>
              <input style={INPUT} value={settings.cep} onChange={(e) => update('cep', e.target.value)} inputMode="numeric" />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label style={LABEL}>Telefone 1</label>
            <input type="tel" style={INPUT} value={settings.telefone1} onChange={(e) => update('telefone1', e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label style={LABEL}>Telefone 2</label>
            <input type="tel" style={INPUT} value={settings.telefone2} onChange={(e) => update('telefone2', e.target.value)} inputMode="tel" />
          </div>
        </div>
      </div>

      {/* Metodo de Custo */}
      <div style={SECTION}>
        <span style={SECTION_TITLE}>Metodo de Custo</span>
        <div style={RADIO_GROUP}>
          <button style={radioStyle(settings.costMethod === 'FIFO')} onClick={() => update('costMethod', 'FIFO')}>
            FIFO (Primeiro a Entrar)
          </button>
          <button style={radioStyle(settings.costMethod === 'AVERAGE')} onClick={() => update('costMethod', 'AVERAGE')}>
            Custo Medio
          </button>
        </div>
      </div>

      {/* Impressoras */}
      <div style={SECTION}>
        <span style={SECTION_TITLE}>Impressoras</span>
        <div>
          <label style={LABEL}>Mini Termica Bluetooth</label>
          <input style={INPUT} value={settings.bluetoothPrinterName} onChange={(e) => update('bluetoothPrinterName', e.target.value)} placeholder="Ex: GOOPJRT PT-260" />
        </div>
        <div>
          <label style={LABEL}>Impressora PC</label>
          <input style={INPUT} value={settings.pcPrinterName} onChange={(e) => update('pcPrinterName', e.target.value)} placeholder="Nome da impressora" />
        </div>
      </div>

      {/* Formato Padrao */}
      <div style={SECTION}>
        <span style={SECTION_TITLE}>Formato Padrao de Impressao</span>
        <div style={RADIO_GROUP}>
          {(['60mm', '80mm', 'A5', 'PDF'] as const).map((fmt) => (
            <button key={fmt} style={radioStyle(settings.defaultPrintFormat === fmt)} onClick={() => update('defaultPrintFormat', fmt)}>
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Sincronizacao */}
      <div style={SECTION}>
        <span style={SECTION_TITLE}>Sincronizacao</span>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span style={STATUS_DOT(connectionStatus === 'connected')} />
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
            {connectionStatus === 'checking' ? 'Verificando...' : ''}
            {connectionStatus === 'connected' ? 'Conectado' : ''}
            {connectionStatus === 'disconnected' ? 'Desconectado' : ''}
            {connectionStatus === 'idle' ? 'Nao verificado' : ''}
          </span>
          {healthMessage && connectionStatus !== 'checking' && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {healthMessage}
            </span>
          )}
        </div>

        {/* APP_INSTANCE_ID */}
        <div>
          <label style={LABEL}>APP_INSTANCE_ID</label>
          <div style={INPUT_WITH_BTN}>
            <input
              style={{ ...INPUT_READONLY, flex: 1, fontSize: 'var(--font-xs)', fontFamily: 'monospace' }}
              value={appInstanceId}
              readOnly
            />
            <button
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', minHeight: '44px' }}
              onClick={handleCopyInstanceId}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* SYNC_SECRET */}
        <div>
          <label style={LABEL}>SYNC_SECRET</label>
          <div style={INPUT_WITH_BTN}>
            <input
              type="password"
              style={{ ...INPUT, flex: 1 }}
              value={syncSecret}
              onChange={(e) => setSyncSecretLocal(e.target.value)}
              placeholder="Chave de sincronizacao"
            />
            <button
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', minHeight: '44px' }}
              onClick={handleSaveSyncSecret}
            >
              {secretSaved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* URL do Servidor */}
        <div>
          <label style={LABEL}>URL do Servidor</label>
          <div style={INPUT_WITH_BTN}>
            <input
              style={{ ...INPUT, flex: 1, fontSize: 'var(--font-sm)' }}
              value={apiUrl}
              onChange={(e) => setApiUrlLocal(e.target.value)}
              placeholder="https://spid-web.vercel.app/api"
            />
            <button
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', minHeight: '44px' }}
              onClick={handleSaveApiUrl}
            >
              {urlSaved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Ultimo Sync */}
        {lastSync && (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Ultimo sync: {new Date(lastSync).toLocaleString('pt-BR')}
          </span>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary btn-block" onClick={handleTestConnection}>
            Testar Conexao
          </button>
          <button className="btn btn-primary btn-block" onClick={handleSyncNow}>
            Sincronizar Agora
          </button>
        </div>
      </div>

      {/* Salvar */}
      <button className="btn btn-primary btn-lg btn-block" onClick={handleSave}>
        {saved ? 'Salvo!' : 'Salvar Configuracoes'}
      </button>
    </div>
  )
}
