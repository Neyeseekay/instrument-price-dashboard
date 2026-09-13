import { PriceChart } from './components/PriceChart'
import { TickerSearch } from './components/TickerSearch'
import './App.css'

function App() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <TickerSearch />
      <div className="mt-6">
        <PriceChart />
      </div>
    </div>
  )
}

export default App
