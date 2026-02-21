import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MobileLayout } from './components/MobileLayout'

// Pages
import { DashboardPage } from './pages/Dashboard'

// Products
import { ProductListPage } from './pages/products/ProductList'
import { ProductFormPage } from './pages/products/ProductForm'
import { ProductDetailPage } from './pages/products/ProductDetail'

// Customers
import { CustomerListPage } from './pages/customers/CustomerList'
import { CustomerFormPage } from './pages/customers/CustomerForm'
import { CustomerDetailPage } from './pages/customers/CustomerDetail'

// Suppliers
import { SupplierListPage } from './pages/suppliers/SupplierList'
import { SupplierFormPage } from './pages/suppliers/SupplierForm'

// Sales
import { SaleListPage } from './pages/sales/SaleList'
import { NewSalePage } from './pages/sales/NewSale'
import { SaleDetailPage } from './pages/sales/SaleDetail'
import { SaleCancelFormPage } from './pages/sales/SaleCancelForm'

// Purchases
import { PurchaseListPage } from './pages/purchases/PurchaseList'
import { PurchaseFormPage } from './pages/purchases/PurchaseForm'
import { PurchaseDetailPage } from './pages/purchases/PurchaseDetail'

// Inventory
import { StockOverviewPage } from './pages/inventory/StockOverview'
import { InventoryCountPage } from './pages/inventory/InventoryCount'
import { MovementListPage } from './pages/inventory/MovementList'

// Finance
import { FinanceOverviewPage } from './pages/finance/FinanceOverview'
import { AccountListPage } from './pages/finance/AccountList'
import { EntryFormPage } from './pages/finance/EntryForm'
import { MonthlyClosurePage } from './pages/finance/MonthlyClosure'

// Others
import { InadimplentesPage } from './pages/Inadimplentes'
import { SettingsPage } from './pages/settings/Settings'

export function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Products */}
          <Route path="/produtos" element={<ProductListPage />} />
          <Route path="/produtos/novo" element={<ProductFormPage />} />
          <Route path="/produtos/:id" element={<ProductDetailPage />} />
          <Route path="/produtos/:id/editar" element={<ProductFormPage />} />

          {/* Customers */}
          <Route path="/clientes" element={<CustomerListPage />} />
          <Route path="/clientes/novo" element={<CustomerFormPage />} />
          <Route path="/clientes/:id" element={<CustomerDetailPage />} />
          <Route path="/clientes/:id/editar" element={<CustomerFormPage />} />

          {/* Suppliers */}
          <Route path="/fornecedores" element={<SupplierListPage />} />
          <Route path="/fornecedores/novo" element={<SupplierFormPage />} />
          <Route path="/fornecedores/:id/editar" element={<SupplierFormPage />} />

          {/* Sales */}
          <Route path="/vendas" element={<SaleListPage />} />
          <Route path="/vendas/nova" element={<NewSalePage />} />
          <Route path="/vendas/:id" element={<SaleDetailPage />} />
          <Route path="/vendas/:id/cancelar" element={<SaleCancelFormPage />} />

          {/* Purchases */}
          <Route path="/compras" element={<PurchaseListPage />} />
          <Route path="/compras/nova" element={<PurchaseFormPage />} />
          <Route path="/compras/:id" element={<PurchaseDetailPage />} />

          {/* Inventory */}
          <Route path="/estoque" element={<StockOverviewPage />} />
          <Route path="/estoque/contagem" element={<InventoryCountPage />} />
          <Route path="/estoque/movimentacoes" element={<MovementListPage />} />

          {/* Finance */}
          <Route path="/financeiro" element={<FinanceOverviewPage />} />
          <Route path="/financeiro/contas" element={<AccountListPage />} />
          <Route path="/financeiro/lancamento" element={<EntryFormPage />} />
          <Route path="/financeiro/fechamento" element={<MonthlyClosurePage />} />

          {/* Others */}
          <Route path="/inadimplentes" element={<InadimplentesPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}
