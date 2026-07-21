const RECONCILABLE_STATES = ['processing', 'completed_with_record_error']

export async function reconcileShopierOrders(supabase, { limit = 100, staleBefore = new Date(Date.now() - 5 * 60 * 1000) } = {}) {
  const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 100))
  const { data: orders, error } = await supabase
    .from('kade_shopier_orders')
    .select('id, shopier_order_id')
    .in('state', RECONCILABLE_STATES)
    .lte('received_at', staleBefore.toISOString())
    .order('received_at', { ascending: true })
    .limit(boundedLimit)
  if (error) throw error

  const summary = { inspected: orders.length, reconciled: 0, needsReview: 0 }
  for (const order of orders) {
    const { data: pkg, error: pkgError } = await supabase
      .from('kade_customer_packages')
      .select('id, customer_id')
      .eq('shopier_order_id', order.shopier_order_id)
      .limit(1)
      .maybeSingle()
    if (pkgError) throw pkgError

    if (pkg) {
      const { error: updateError, count } = await supabase
        .from('kade_shopier_orders')
        .update({
          state: 'completed_reconciled',
          customer_id: pkg.customer_id,
          package_id: pkg.id,
          reconciled_at: new Date().toISOString(),
        }, { count: 'exact' })
        .eq('id', order.id)
        .in('state', RECONCILABLE_STATES)
      if (updateError) throw updateError
      if (count) summary.reconciled += 1
      continue
    }

    const { error: updateError, count } = await supabase
      .from('kade_shopier_orders')
      .update({ state: 'needs_review', reason: 'entitlement_not_found', reconciled_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', order.id)
      .in('state', RECONCILABLE_STATES)
    if (updateError) throw updateError
    if (count) summary.needsReview += 1
  }
  return summary
}
