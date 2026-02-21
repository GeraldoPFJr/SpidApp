import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MobileLayout } from './components/MobileLayout'
import { DashboardPage } from './pages/Dashboard'
import { ProdutosPage } from './pages/Produtos'
import { ClientesPage } from './pages/Clientes'
import { FornecedoresPage } from './pages/Fornecedores'
import { VendasPage } from './pages/Vendas'
import { NovaVendaPage } from './pages/NovaVenda'
import { ComprasPage } from './pages/Compras'
import { EstoquePage } from './pages/Estoque'
import { FinanceiroPage } from './pages/Financeiro'
import { InadimplentesPage } from './pages/Inadimplentes'
import { ConfiguracoesPage } from './pages/Configuracoes'

export function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/vendas/nova" element={<NovaVendaPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/inadimplentes" element={<InadimplentesPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}
