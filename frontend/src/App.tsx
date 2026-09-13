import { Header } from './components/Header'
import { PriceChart } from './components/PriceChart'
import { SplashScreen } from './components/SplashScreen'
import { StatsPanel } from './components/StatsPanel'
import { TickerSearch } from './components/TickerSearch'
import './App.css'

function App() {
  return (
    <SplashScreen>
      <Header />
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-semibold text-ink">Price Dashboard</h1>
        <TickerSearch />
        <div className="mt-6">
          <PriceChart />
        </div>
        <div className="mt-6">
          <StatsPanel />
        </div>
      </div>
    </SplashScreen>
  )
}

export default App
