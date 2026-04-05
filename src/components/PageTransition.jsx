// Simple wrapper — no animation delay, pages render instantly
export default function PageTransition({ children }) {
  return (
    <div className="page-wrapper">
      {children}
    </div>
  )
}
