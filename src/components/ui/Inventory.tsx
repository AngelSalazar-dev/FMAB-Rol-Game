'use client';

interface InventoryProps {
  items: Array<{ id: string; name: string; quantity: number; item_type: string; properties: Record<string, any> }>;
}

export function Inventory({ items }: InventoryProps) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.item_type]) acc[item.item_type] = [];
    acc[item.item_type].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const typeLabels: Record<string, string> = {
    material: 'MATERIALES',
    weapon: 'ARMAS',
    tool: 'HERRAMIENTAS',
    consumable: 'CONSUMIBLES',
    key: 'OBJETOS CLAVE',
  };

  if (items.length === 0) {
    return (
      <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4">
        <h3 className="font-mono text-xs text-fmab-gold mb-3 tracking-wider">INVENTARIO</h3>
        <p className="text-fmab-steel text-sm italic">Vacío. El vacío pesa más que el plomo.</p>
      </div>
    );
  }

  return (
    <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4">
      <h3 className="font-mono text-xs text-fmab-gold mb-3 tracking-wider">INVENTARIO</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {Object.entries(grouped).map(([type, typeItems]) => (
          <div key={type} className="space-y-1">
            <div className="font-mono text-xs text-fmab-steel uppercase tracking-wider">{typeLabels[type] || type.toUpperCase()}</div>
            {typeItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm pl-2 border-l-2 border-fmab-border">
                <span className="text-fmab-parchment">{item.name}</span>
                <span className="text-fmab-goldLight font-mono">x{item.quantity}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}