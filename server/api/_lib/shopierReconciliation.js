const RECONCILABLE_STATES = ['processing', 'completed_with_record_error']

export async function reconcileShopierOrders(db, { limit = 100, staleBefore = new Date(Date.now() - 5 * 60 * 1000) } = {}) {
  const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 100))
  const orders = await db.collection('shopier_orders')
    .find({ state: { $in: RECONCILABLE_STATES }, receivedAt: { $lte: staleBefore } })
    .sort({ receivedAt: 1 })
    .limit(boundedLimit)
    .toArray()

  const summary = { inspected: orders.length, reconciled: 0, needsReview: 0 }
  for (const order of orders) {
    const customer = await db.collection('customers').findOne(
      { 'packages.shopierOrderId': order.shopierOrderId },
      { projection: { _id: 1, packages: { $elemMatch: { shopierOrderId: order.shopierOrderId } } } }
    )

    if (customer) {
      const pkg = customer.packages?.[0]
      const result = await db.collection('shopier_orders').updateOne(
        { _id: order._id, state: { $in: RECONCILABLE_STATES } },
        { $set: {
          state: 'completed_reconciled',
          customerId: customer._id.toString(),
          packageId: pkg?.id || null,
          reconciledAt: new Date(),
        } }
      )
      if (result.modifiedCount) summary.reconciled += 1
      continue
    }

    const result = await db.collection('shopier_orders').updateOne(
      { _id: order._id, state: { $in: RECONCILABLE_STATES } },
      { $set: { state: 'needs_review', reason: 'entitlement_not_found', reconciledAt: new Date() } }
    )
    if (result.modifiedCount) summary.needsReview += 1
  }
  return summary
}
