import React from 'react'
import type { User } from '@shared/contracts'
import { Store, CheckCircle2, AlertCircle } from '../../shared/icons/Icons'
import { useAuth } from './hooks/useAuth'
import AuthHeader from './components/AuthHeader'
import LoginForm from './components/LoginForm'
import QuickPinModal from './components/QuickPinModal'
import ForgotPasswordView from './components/ForgotPasswordView'
import VerifyCodeResetPasswordView from './components/VerifyCodeResetPasswordView'
import AuthFooter from './components/AuthFooter'

interface LoginViewProps {
  onLoginSuccess: (user: User) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const {
    isLoading,
    errorMessage,
    toast,
    isPinModalOpen,
    authStep,
    resetEmail,
    setAuthStep,
    setIsPinModalOpen,
    handleLogin,
    handlePinLogin,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    showToast
  } = useAuth(onLoginSuccess)

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#F3F3F3] text-[#1B1B1B] select-none overflow-hidden">
      {/* 1. Windows 11 Native Acrylic Top Header */}
      <AuthHeader />

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed top-14 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white text-xs rounded-md shadow-xl border border-slate-700 animate-modal backdrop-blur-xs select-none">
          {toast.type === 'error' ? (
            <AlertCircle size={16} className="text-[#C42B1C]" />
          ) : (
            <CheckCircle2 size={16} className="text-[#107C41]" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 2. Main Work Area */}
      <main className="w-full pt-11 flex-1 flex flex-col items-center justify-center relative">
        {/* Ambient Lighting Spheres */}
        <div className="absolute -top-28 -left-20 w-96 h-96 rounded-full bg-[#0067C0]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-[#107C41]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 rounded-full bg-[#0067C0]/10 blur-2xl pointer-events-none" />

        {/* ── SCREEN 1: LOGIN ── */}
        {authStep === 'LOGIN' && (
          <div className="relative w-full max-w-[490px] bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl flex flex-col overflow-hidden border border-[#E5E5E5] animate-modal">
            {/* Top Ribbon Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0067C0] via-[#0078D4] to-[#107C41]" />

            <div className="p-6 pb-5 flex flex-col gap-4">
              {/* Header & Identity */}
              <div className="flex flex-col items-center text-center mb-3">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#0067C0] to-[#0078D4] flex items-center justify-center text-white shadow-md">
                    <Store size={28} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <span className="w-3 h-3 rounded-full bg-[#107C41] animate-pulse" />
                  </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#1B1B1B]">
                  Iniciar Sesión en NexusPOS
                </h1>
                <p className="text-xs text-[#5C5C5C] max-w-sm mt-1">
                  Ingrese sus credenciales de dominio o cuenta de operador para acceder al sistema.
                </p>
                {/* Connectivity Pill */}
                {/* <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#107C41] font-mono text-[11px] font-semibold border border-[#C8E6C9]">
                  <span className="w-2 h-2 rounded-full bg-[#107C41]" />
                  <span>Servidor de Autenticación Online</span>
                  <span className="text-[#5C5C5C] opacity-60">|</span>
                  <span className="font-mono text-[10px]">18ms</span>
                </div> */}
              </div>

              {/* Login Form */}
              <LoginForm
                isLoading={isLoading}
                errorMessage={errorMessage}
                onSubmit={handleLogin}
                onOpenPinModal={() => setIsPinModalOpen(true)}
                onOpenForgotModal={() => setAuthStep('FORGOT_EMAIL')}
                onRfidClick={() =>
                  showToast('Acérquese al lector RFID / NFC USB de la estación CAJA-01...', 'info')
                }
              />
            </div>

            {/* Card Footer */}
            <div className="px-6 py-2.5 bg-[#F8F9FA] border-t border-[#E5E5E5] flex flex-wrap items-center justify-between text-[#717783] text-[11px]">
              <span className="font-mono">NexusPOS</span>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-[#1B1B1B]">
                  <span className="px-1 py-0.5 rounded bg-white border border-[#D1D5DB] shadow-2xs">
                    ENTER
                  </span>{' '}
                  Acceder
                </span>
                <span>•</span>
                <span>
                  <span className="px-1 py-0.5 rounded bg-white border border-[#D1D5DB] shadow-2xs">
                    ESC
                  </span>{' '}
                  Salir
                </span>
                <span>•</span>
                <span>
                  <span className="px-1 py-0.5 rounded bg-white border border-[#D1D5DB] shadow-2xs">
                    F1
                  </span>{' '}
                  Recuperar
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN 2: RECUPERAR CONTRASEÑA — ingreso de correo ── */}
        {authStep === 'FORGOT_EMAIL' && (
          <ForgotPasswordView
            isLoading={isLoading}
            onBackToLogin={() => setAuthStep('LOGIN')}
            onCodeSent={handleSendOtp}
          />
        )}

        {/* ── SCREEN 3: VERIFICAR OTP + NUEVA CONTRASEÑA (split layout) ── */}
        {(authStep === 'VERIFY_OTP' || authStep === 'RESET_PASSWORD') && (
          <div className="w-full flex items-center justify-center p-4">
            <VerifyCodeResetPasswordView
              email={resetEmail}
              otpVerified={authStep === 'RESET_PASSWORD'}
              isLoading={isLoading}
              onBackToLogin={() => setAuthStep('LOGIN')}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={() => handleSendOtp(resetEmail)}
              onCompleteReset={handleResetPassword}
            />
          </div>
        )}
      </main>

      {/* 3. Bottom Terminal Status Footer */}
      <AuthFooter />

      {/* 4. Quick PIN Modal (F10) */}
      <QuickPinModal
        isOpen={isPinModalOpen}
        isLoading={isLoading}
        onClose={() => setIsPinModalOpen(false)}
        onSubmitPin={handlePinLogin}
      />
    </div>
  )
}

export default LoginView
