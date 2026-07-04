import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { customerSessionApi, customerLogoutApi } from '../api'
import { getUserEntitlements } from '../config/entitlements'

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

  const entitlements = useMemo(() => getUserEntitlements(customer?.email), [customer?.email])

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, checked, logout, entitlements }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  return useContext(CustomerContext)
}
