import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { customerSessionApi, customerLogoutApi, customerPortalApi } from '../api'
import { getUserEntitlements } from '../config/entitlements'

const CustomerContext = createContext(null)

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    customerSessionApi()
      .then(async data => {
        if (!cancelled) {
          if (data?.authenticated) {
            let nextCustomer = data.customer
            try {
              const portal = await customerPortalApi()
              nextCustomer = {
                ...nextCustomer,
                packages: portal?.packages || [],
                entitlements: portal?.entitlements || nextCustomer?.entitlements,
              }
            } catch { /* keep the lightweight session */ }
            if (!cancelled) setCustomer(nextCustomer)
          } else {
            setCustomer(null)
          }
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

  const entitlements = useMemo(
    () => getUserEntitlements(customer?.email, customer?.packages, customer?.entitlements),
    [customer?.email, customer?.packages, customer?.entitlements]
  )

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, checked, logout, entitlements }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  return useContext(CustomerContext)
}
