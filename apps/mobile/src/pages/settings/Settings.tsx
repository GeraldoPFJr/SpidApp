import { type CSSProperties, useEffect, useState } from 'react'

interface SettingsData {
  // Cupom
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
  // Metodo
  costMethod: 'FIFO' | 'AVERAGE'
  // Tabela padrao
  defaultPriceTierId: string
  // Impressoras
  bluetoothPrinterName: string
  pcPrinterName: string
  // Formato padrao
  defaultPrintFormat: '60mm' | '80mm' | 'A5' | 'PDF'
  // Sync
  appInstanceId: string
  syncSecret: string
  lastSyncAt: string | null
}

function loadSettings(): SettingsData {
  const stored = localStorage.getItem('spid_settings')
  const defaults: SettingsData = {
    razaoSocial: '', nomeFantasia: '', cnpj: '', ie: '',
    endereco: '', cidade: '', uf: '', cep: '', telefone1: '', telefone2: '',
    costMethod: 'FIFO', defaultPriceTierId: '',
    bluetoothPrinterName: '', pcPrinterName: '',
    defaultPrintFormat: '80mm',
    appInstanceId: localStorage.getItem('APP_INSTANCE_ID') ?? '',
    syncSecret: localStorage.getItem('SYNC_SECRET') ?? '',
    lastSyncAt: null,
  }
  if (stored) {
    try {
      return { ...defaults, ...JSON.parse(stored) }
    } catch { /* ignore */ }
  }
  return defaults
}

function saveSettings(data: SettingsData) {
  localStorage.setItem('spid_settings', JSON.stringify(data))
  localStorage.setItem('APP_INSTANCE_ID', data.appInstanceId)
  localStorage.setItem('SYNC_SECRET', data.syncSecret)
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const labelStyle: CSSProperties = { fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

  const radioGroupStyle: CSSProperties = { display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }
  const radioStyle = (active: boolean): CSSProperties => ({
    padding: 'var(--sp-2) var(--sp-3)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    backgroundColor: active ? 'var(--primary-50)' : 'var(--surface)',
    color: active ? 'var(--primary-700)' : 'var(--text-secondary)',
    fontWeight: 500, fontSize: 'var(--font-sm)', cursor: 'pointer',
    minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all var(--transition-fast)', flex: '1 0 auto',
  })

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Dados do Cupom */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Dados do Cupom</span>
        <div>
          <label style={labelStyle}>Razao Social</label>
          <input style={inputStyle} value={settings.razaoSocial} onChange={(e) => update('razaoSocial', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Nome Fantasia</label>
          <input style={inputStyle} value={settings.nomeFantasia} onChange={(e) => update('nomeFantasia', e.target.value)} />
        </div>
        <div className="form-row">
          <div>
            <label style={labelStyle}>CNPJ</label>
            <input style={inputStyle} value={settings.cnpj} onChange={(e) => update('cnpj', e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>IE</label>
            <input style={inputStyle} value={settings.ie} onChange={(e) => update('ie', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Endereco</label>
          <input style={inputStyle} value={settings.endereco} onChange={(e) => update('endereco', e.target.value)} />
        </div>
        <div className="form-row">
          <div>
            <label style={labelStyle}>Cidade</label>
            <input style={inputStyle} value={settings.cidade} onChange={(e) => update('cidade', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
            <div>
              <label style={labelStyle}>UF</label>
              <input style={inputStyle} value={settings.uf} onChange={(e) => update('uf', e.target.value)} maxLength={2} />
            </div>
            <div>
              <label style={labelStyle}>CEP</label>
              <input style={inputStyle} value={settings.cep} onChange={(e) => update('cep', e.target.value)} inputMode="numeric" />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label style={labelStyle}>Telefone 1</label>
            <input type="tel" style={inputStyle} value={settings.telefone1} onChange={(e) => update('telefone1', e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label style={labelStyle}>Telefone 2</label>
            <input type="tel" style={inputStyle} value={settings.telefone2} onChange={(e) => update('telefone2', e.target.value)} inputMode="tel" />
          </div>
        </div>
      </div>

      {/* Metodo de Custo */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Metodo de Custo</span>
        <div style={radioGroupStyle}>
          <button style={radioStyle(settings.costMethod === 'FIFO')} onClick={() => update('costMethod', 'FIFO')}>
            FIFO (Primeiro a Entrar)
          </button>
          <button style={radioStyle(settings.costMethod === 'AVERAGE')} onClick={() => update('costMethod', 'AVERAGE')}>
            Custo Medio
          </button>
        </div>
      </div>

      {/* Impressoras */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Impressoras</span>
        <div>
          <label style={labelStyle}>Mini Termica Bluetooth</label>
          <input style={inputStyle} value={settings.bluetoothPrinterName} onChange={(e) => update('bluetoothPrinterName', e.target.value)} placeholder="Ex: GOOPJRT PT-260" />
        </div>
        <div>
          <label style={labelStyle}>Impressora PC</label>
          <input style={inputStyle} value={settings.pcPrinterName} onChange={(e) => update('pcPrinterName', e.target.value)} placeholder="Nome da impressora" />
        </div>
      </div>

      {/* Formato Padrao */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Formato Padrao de Impressao</span>
        <div style={radioGroupStyle}>
          {(['60mm', '80mm', 'A5', 'PDF'] as const).map((fmt) => (
            <button key={fmt} style={radioStyle(settings.defaultPrintFormat === fmt)} onClick={() => update('defaultPrintFormat', fmt)}>
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Sincronizacao */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Sincronizacao</span>
        <div>
          <label style={labelStyle}>APP_INSTANCE_ID</label>
          <input style={{ ...inputStyle, backgroundColor: 'var(--neutral-100)', color: 'var(--text-muted)' }} value={settings.appInstanceId} readOnly />
        </div>
        <div>
          <label style={labelStyle}>SYNC_SECRET</label>
          <input
            type="password"
            style={inputStyle}
            value={settings.syncSecret}
            onChange={(e) => update('syncSecret', e.target.value)}
            placeholder="Chave de sincronizacao"
          />
        </div>
        {settings.lastSyncAt && (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Ultimo sync: {new Date(settings.lastSyncAt).toLocaleString('pt-BR')}
          </span>
        )}
        <button className="btn btn-secondary btn-block" onClick={() => {}}>
          Sincronizar Agora
        </button>
      </div>

      {/* Salvar */}
      <button className="btn btn-primary btn-lg btn-block" onClick={handleSave}>
        {saved ? 'Salvo!' : 'Salvar Configuracoes'}
      </button>
    </div>
  )
}
