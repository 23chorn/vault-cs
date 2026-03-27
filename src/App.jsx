import { useState } from 'react'
import { usePropertyStore } from './store/usePropertyStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import PropertyOverview from './components/property/PropertyOverview'
import PropertyConfig from './components/property/PropertyConfig'
import CostBreakdown from './components/property/CostBreakdown'
import MortgageModel from './components/property/MortgageModel'
import RateSensitivity from './components/property/RateSensitivity'
import ProjectionModel from './components/property/ProjectionModel'
import SellVsHold from './components/property/SellVsHold'

export default function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const store = usePropertyStore()
  const { activeProperty, updateField, resetSection, loading, saveStatus } = store

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading property data...</p>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <PropertyOverview property={activeProperty} onNavigate={setActiveSection} />
      case 'config':
        return <PropertyConfig property={activeProperty} updateField={updateField} resetSection={resetSection} />
      case 'costs':
        return <CostBreakdown property={activeProperty} />
      case 'mortgage':
        return <MortgageModel property={activeProperty} />
      case 'rates':
        return <RateSensitivity property={activeProperty} />
      case 'projections':
        return <ProjectionModel property={activeProperty} />
      case 'sellvshold':
        return <SellVsHold property={activeProperty} />
      default:
        return <PropertyOverview property={activeProperty} onNavigate={setActiveSection} />
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        propertyName={activeProperty.meta.name}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header property={activeProperty} saveStatus={saveStatus} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
