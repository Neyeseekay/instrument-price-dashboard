import { useAppSelector } from './app/hooks'
import { useUrlTickerSync } from './app/useUrlTickerSync'
import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { PriceChart } from './components/PriceChart'
import { SplashScreen } from './components/SplashScreen'
import { StatsPanel } from './components/StatsPanel'
import { TickerSearch } from './components/TickerSearch'

function App() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers)
  useUrlTickerSync()

  return (
    <SplashScreen>
      <Header />
      <div className="mx-auto max-w-5xl p-4">
        <h1 className="mb-4 bg-gradient-to-b from-brand-light to-brand bg-clip-text text-2xl font-semibold text-transparent">
          Price Dashboard
        </h1>
        <div className="max-w-md">
          <TickerSearch />
        </div>
        <div className="mt-6">
          {selectedTickers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <PriceChart />
              <div className="mt-6">
                <StatsPanel />
              </div>
            </>
          )}
        </div>
      </div>
    </SplashScreen>
  )
}

export default App
