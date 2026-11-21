import React from 'react'

export const AuthFooter: React.FC = () => {
  return (
    <footer className="w-full py-2.5 bg-white/70 backdrop-blur-md border-t border-[#E5E5E5] select-none">
      <div className="w-full px-4 flex items-center justify-between text-[#717783] text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#107C41] inline-block animate-pulse"></span>
            Workstation CAJA-01 (Terminal Online)
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#E8E8E8] text-[#5C5C5C]">
            v4.18.2-LTS
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="bg-[#E8E8E8] px-1.5 py-0.5 rounded text-[#5C5C5C]">F1: RECUPERAR</span>
          <span className="bg-[#E8E8E8] px-1.5 py-0.5 rounded text-[#5C5C5C]">F10: PIN</span>
          <span className="bg-[#E8E8E8] px-1.5 py-0.5 rounded text-[#5C5C5C]">ESC: CERRAR</span>
        </div>
      </div>
    </footer>
  )
}

export default AuthFooter
