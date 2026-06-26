import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { customerSessionApi, customerLogoutApi } from '../api'

const CustomerContext = createContext(null)

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    customerSessionApi()
      .then(data => {
        if (!cancelled) {
          setCustomer(data?.authenticated ? data.customer : null)
          setChecked(true)
        }
      })
      .catch(() => {
        if (!cancelled) { setCustomer(null); setChecked(true) }
      })
    return () => { cancelled = true }
  }, [])

  const logout = useCallback(async () => {
    await customerLogoutApi().catch(() => {})
    setCustomer(null)
  }, [])

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, checked, logout }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  return useContext(CustomerContext)
}
