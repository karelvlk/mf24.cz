interface NewsSidebarProps {
  excludeCategory?: string;
}

export default function NewsSidebar({ excludeCategory }: NewsSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Advertisement 1 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
          REKLAMA
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded p-4">
          <h3 className="font-bold text-lg mb-2">Novinka 2024</h3>
          <p className="text-sm mb-3">Objevte nejnovější technologie</p>
          <button className="bg-white text-blue-600 px-4 py-2 rounded font-medium text-sm">
            Zjistit více
          </button>
        </div>
      </div>

      {/* Weather widget */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg p-4">
        <h2 className="font-bold mb-2">POČASÍ</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">18°C</div>
            <div className="text-sm opacity-90">Praha</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Polojasno</div>
            <div className="text-xs opacity-90">Vítr: 12 km/h</div>
          </div>
        </div>
      </div>

      {/* Advertisement 2 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
          REKLAMA
        </div>
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded p-4">
          <h3 className="font-bold text-lg mb-2">Speciální nabídka</h3>
          <p className="text-sm mb-3">Ušetřete až 50%</p>
          <button className="bg-white text-green-600 px-4 py-2 rounded font-medium text-sm">
            Koupit nyní
          </button>
        </div>
      </div>

      {/* Stock market widget */}
      <div className="bg-card border border-separator rounded-lg p-4">
        <h2 className="headline-tertiary mb-4 text-primary">
          KURZY
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">EUR/CZK</span>
            <span className="text-sm font-bold text-green-600">25.18 ▲</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">USD/CZK</span>
            <span className="text-sm font-bold text-red-600">23.42 ▼</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">PX Index</span>
            <span className="text-sm font-bold text-green-600">1,487 ▲</span>
          </div>
        </div>
      </div>
    </aside>
  );
}