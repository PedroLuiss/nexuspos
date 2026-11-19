import React from 'react'

interface ScaleReadoutPanelsProps {
  isConnected: boolean
  comPort: string
  baudRate: number
  scaleWeight: string
  isStable: boolean
}

export function ScaleReadoutPanels({
  isConnected,
  comPort,
  baudRate,
  scaleWeight,
  isStable
}: ScaleReadoutPanelsProps): React.JSX.Element {
  return (
    <>
      <div
        className={`p-3 rounded-[4px] border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">{isConnected ? 'Conectado' : 'Desconectado'}</span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span>Puerto: {comPort}</span>
          <span>{baudRate} bps</span>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <label className="block font-semibold text-[#1B1B1B]">Peso en Vivo</label>
          <div className="p-4 bg-slate-900 rounded-[4px] border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block tracking-widest uppercase mb-1">
              Pantalla Digital de Balanza
            </span>
            <div
              className={`text-3xl font-extrabold tracking-wider my-1 ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {scaleWeight}
            </div>
            <span className={`text-[10px] ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isStable ? 'Lectura estable' : 'Estabilizando...'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-[4px] border border-slate-200 text-center">
          <span className="text-[10px] text-slate-400 block tracking-widest uppercase mb-1">
            Pantalla Digital de Balanza
          </span>
          <div className="text-3xl font-mono text-slate-400 my-1">0.000 KG</div>
          <span className="text-[10px] text-slate-400">
            Conecte la báscula para leer peso en vivo
          </span>
        </div>
      )}
    </>
  )
}
