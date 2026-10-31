// Admin helpers: CSV download and printable packing slip.

const escapeCsv = (value) => {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const downloadCsv = (filename, rows) => {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [headers.join(','), ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

/** Opens a clean print view for the courier box. Everything is HTML-escaped. */
export const printPackingSlip = (order) => {
  const a = order.shipping_address || {}
  const rows = (order.order_items || [])
    .map(i => `<tr><td>${esc(i.name)}</td><td style="text-align:right">${esc(i.quantity)}</td></tr>`)
    .join('')
  const win = window.open('', '_blank', 'width=720,height=900')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>Packing slip ${esc(order.order_number)}</title>
    <style>body{font:14px/1.5 system-ui,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px 0;border-bottom:1px solid #ddd;text-align:left}
    .box{border:2px solid #111;padding:12px;margin-top:16px}.muted{color:#666}</style></head><body>
    <h1>ZION — Packing slip</h1><p class="muted">Order ${esc(order.order_number)} · ${esc(new Date(order.created_at).toLocaleDateString())}</p>
    <div class="box"><strong>Ship to</strong><br>${esc(a.full_name)}<br>${esc(a.phone)}<br>${esc(a.address)}<br>
    ${esc([a.city, a.province, a.postal_code].filter(Boolean).join(', '))}<br>${esc(a.country)}</div>
    <table><thead><tr><th>Item</th><th style="text-align:right">Qty</th></tr></thead><tbody>${rows}</tbody></table>
    ${order.payment_method === 'cod' ? `<p class="box"><strong>COLLECT ON DELIVERY: $${Number(order.total).toFixed(2)}</strong></p>` : '<p class="muted">Prepaid</p>'}
    ${order.gift_note ? `<p>Gift note: ${esc(order.gift_note)}</p>` : ''}
    <script>window.onload=function(){window.print()}</script></body></html>`)
  win.document.close()
}
