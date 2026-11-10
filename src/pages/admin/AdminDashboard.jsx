import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck
} from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'
import { useAdminAlerts } from './AdminAlerts'
import { useAdminTheme } from '../../context/AdminThemeContext'
import StatusBadge from '../../components/orders/StatusBadge'
import { formatDate, isCodOrder, isCodOrderApproved, money } from '../../lib/orders'
import { isAiConfigured } from '../../services/aiService'
import { embedAllProductsInSupabase } from '../../services/productEmbeddingService'

// Smooth cubic Bezier path calculation for interactive SVG chart
function getCubicBezierPath(points) {
  if (!points || points.length < 2) return ''
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`
    const prev = a[i - 1]
    const cp1x = prev.x + (point.x - prev.x) / 2
    const cp1y = prev.y
    const cp2x = prev.x + (point.x - prev.x) / 2
    const cp2y = point.y
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`
  }, '')
}

/**
 * Computes REAL dynamic time-series buckets from actual customer transactions in `orders`.
 */
function computeTimeframeStats(orders, timeframe, chartMetric) {
  const now = new Date()
  let buckets = []
  let compBuckets = []
  let label = ''
  let subtext = ''

  if (timeframe === '1d') {
    label = 'Last 24 Hours'
    subtext = 'vs yesterday'
    const hours = [20, 16, 12, 8, 4, 0]
    buckets = hours.map((hOffset) => {
      const start = new Date(now.getTime() - (hOffset + 4) * 3600 * 1000)
      const end = new Date(now.getTime() - hOffset * 3600 * 1000)
      const bucketLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      return { start, end, label: bucketLabel, revenue: 0, orderCount: 0, productCount: 0 }
    })
    compBuckets = hours.map((hOffset) => {
      const start = new Date(now.getTime() - (hOffset + 28) * 3600 * 1000)
      const end = new Date(now.getTime() - (hOffset + 24) * 3600 * 1000)
      return { start, end, revenue: 0, orderCount: 0, productCount: 0 }
    })
  } else if (timeframe === '7d') {
    label = 'Last 7 Days'
    subtext = 'vs prior 7 days'
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
      const dayLabel = i === 0 ? 'Today' : start.toLocaleDateString('en-US', { weekday: 'short' })
      buckets.push({ start, end, label: dayLabel, revenue: 0, orderCount: 0, productCount: 0 })

      const compD = new Date(now)
      compD.setDate(compD.getDate() - (i + 7))
      const compStart = new Date(compD.getFullYear(), compD.getMonth(), compD.getDate(), 0, 0, 0)
      const compEnd = new Date(compD.getFullYear(), compD.getMonth(), compD.getDate(), 23, 59, 59)
      compBuckets.push({ start: compStart, end: compEnd, revenue: 0, orderCount: 0, productCount: 0 })
    }
  } else if (timeframe === '30d') {
    label = 'Last 30 Days'
    subtext = 'vs prior 30 days'
    const weekDays = [28, 21, 14, 7, 0]
    for (let i = 0; i < 4; i++) {
      const start = new Date(now.getTime() - weekDays[i] * 86400 * 1000)
      const end = new Date(now.getTime() - weekDays[i + 1] * 86400 * 1000)
      buckets.push({ start, end, label: `Week ${i + 1}`, revenue: 0, orderCount: 0, productCount: 0 })

      const compStart = new Date(now.getTime() - (weekDays[i] + 30) * 86400 * 1000)
      const compEnd = new Date(now.getTime() - (weekDays[i + 1] + 30) * 86400 * 1000)
      compBuckets.push({ start: compStart, end: compEnd, revenue: 0, orderCount: 0, productCount: 0 })
    }
  } else if (timeframe === '12m') {
    label = 'Last 12 Months'
    subtext = 'vs prior year'
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthLabel = start.toLocaleDateString('en-US', { month: 'short' })
      buckets.push({ start, end, label: monthLabel, revenue: 0, orderCount: 0, productCount: 0 })

      const compStart = new Date(now.getFullYear() - 1, now.getMonth() - i, 1)
      const compEnd = new Date(now.getFullYear() - 1, now.getMonth() - i + 1, 0, 23, 59, 59)
      compBuckets.push({ start: compStart, end: compEnd, revenue: 0, orderCount: 0, productCount: 0 })
    }
  } else {
    // 'Max' All-Time
    label = 'All Time'
    subtext = 'All-time transactions'
    const curYear = now.getFullYear()
    const orderYears = orders.map((o) => new Date(o.created_at).getFullYear()).filter(Boolean)
    const startYear = orderYears.length > 0 ? Math.min(...orderYears) : curYear - 2
    for (let y = startYear; y <= curYear; y++) {
      const start = new Date(y, 0, 1)
      const end = new Date(y, 11, 31, 23, 59, 59)
      buckets.push({ start, end, label: String(y), revenue: 0, orderCount: 0, productCount: 0 })

      const compStart = new Date(y - 1, 0, 1)
      const compEnd = new Date(y - 1, 11, 31, 23, 59, 59)
      compBuckets.push({ start: compStart, end: compEnd, revenue: 0, orderCount: 0, productCount: 0 })
    }
  }

  // Populate buckets with REAL customer transactions
  orders.forEach((o) => {
    const orderDate = new Date(o.created_at)
    const isPaid = o.payment_status === 'paid' || o.payment_status === 'cod'
    const orderTotal = Number(o.total) || 0
    const itemCount = (o.order_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)

    buckets.forEach((b) => {
      if (orderDate >= b.start && orderDate <= b.end) {
        b.orderCount += 1
        b.productCount += itemCount
        if (isPaid) b.revenue += orderTotal
      }
    })

    compBuckets.forEach((b) => {
      if (orderDate >= b.start && orderDate <= b.end) {
        b.orderCount += 1
        b.productCount += itemCount
        if (isPaid) b.revenue += orderTotal
      }
    })
  })

  const currentTotalRevenue = buckets.reduce((acc, b) => acc + b.revenue, 0)
  const priorTotalRevenue = compBuckets.reduce((acc, b) => acc + b.revenue, 0)
  const currentTotalOrders = buckets.reduce((acc, b) => acc + b.orderCount, 0)
  const priorTotalOrders = compBuckets.reduce((acc, b) => acc + b.orderCount, 0)

  // Real delta calculation
  let delta = '0.0%'
  let deltaPositive = true
  const currentVal = chartMetric === 'revenue' ? currentTotalRevenue : currentTotalOrders
  const priorVal = chartMetric === 'revenue' ? priorTotalRevenue : priorTotalOrders

  if (priorVal > 0) {
    const diff = ((currentVal - priorVal) / priorVal) * 100
    delta = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
    deltaPositive = diff >= 0
  } else if (currentVal > 0) {
    delta = '+100%'
    deltaPositive = true
  } else {
    delta = '0.0%'
    deltaPositive = true
  }

  const points = buckets.map((b) => (chartMetric === 'revenue' ? Math.round(b.revenue * 100) / 100 : b.orderCount))
  const compPoints = compBuckets.map((b) => (chartMetric === 'revenue' ? Math.round(b.revenue * 100) / 100 : b.orderCount))
  const labels = buckets.map((b) => b.label)

  return {
    label,
    labels,
    buckets,
    points,
    compPoints,
    delta,
    deltaPositive,
    subtext,
    currentTotalRevenue,
    currentTotalOrders
  }
}

const AdminDashboard = () => {
  const { supabase } = useSupabase()
  const { lowStock, lastUpdated } = useAdminAlerts()
  const { isDark } = useAdminTheme()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [aiLogs, setAiLogs] = useState([])
  const [refundTriages, setRefundTriages] = useState([])
  const [syncingEmbeddings, setSyncingEmbeddings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('30d')
  const [chartMetric, setChartMetric] = useState('revenue') // 'revenue' | 'orders'
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [spotlightIndex, setSpotlightIndex] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [o, p, logsRes, refundsRes] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id, order_number, status, payment_status, payment_method, total, subtotal, discount, tax, shipping_fee, customer_name, customer_email, created_at, paid_at, order_items(id, product_id, name, quantity, price, image_url)'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, price, stock, low_stock_threshold, image_url, category, is_active, embedding, ai_review_summary')
          .order('created_at', { ascending: false }),
        supabase
          .from('ai_api_logs')
          .select('id, feature, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('refund_requests')
          .select('id, order_id, status, ai_confidence_score, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      if (o.error) {
        console.warn('[AdminDashboard] Orders fetch note:', o.error)
        setError(o.error.message)
      } else {
        setError('')
      }

      setOrders(o.data || [])
      setProducts(p.data || [])
      setAiLogs(logsRes?.data || [])
      setRefundTriages(refundsRes?.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load telemetry')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const handleDashboardSyncEmbeddings = async () => {
    if (syncingEmbeddings) return
    setSyncingEmbeddings('Starting…')
    try {
      await embedAllProductsInSupabase(supabase, ({ current, total }) => {
        setSyncingEmbeddings(`Indexing ${current}/${total}…`)
      })
      await loadData()
      setSyncingEmbeddings('Indexed!')
      setTimeout(() => setSyncingEmbeddings(null), 2500)
    } catch {
      setSyncingEmbeddings(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData, lastUpdated])

  // Real-time live synchronization for customer transactions
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadData])

  // Computed metrics from real orders & products
  const stats = useMemo(() => {
    const byStatus = {}
    orders.forEach((o) => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1
    })
    const revenue = orders
      .filter((o) => o.payment_status === 'paid' || o.payment_status === 'cod')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

    const codPending = orders.filter(
      (o) => o.status === 'to_ship' && isCodOrder(o) && !isCodOrderApproved(o)
    ).length

    return {
      byStatus,
      revenue,
      completed: byStatus.completed || 0,
      toShip: byStatus.to_ship || 0,
      codPending,
      totalOrders: orders.length,
      totalProducts: products.length
    }
  }, [orders, products])

  // Real dynamic telemetry dataset for SVG chart
  const timeframeStats = useMemo(() => {
    return computeTimeframeStats(orders, timeframe, chartMetric)
  }, [orders, timeframe, chartMetric])

  const chartPoints = timeframeStats.points
  const chartCompPoints = timeframeStats.compPoints

  // SVG dimensions
  const svgWidth = 800
  const svgHeight = 220
  const padX = 40
  const padY = 30

  // Coordinates computed directly from real transaction data points
  const maxVal = Math.max(...chartPoints, ...chartCompPoints, chartMetric === 'revenue' ? 50 : 5) * 1.15
  const coords = useMemo(() => {
    return chartPoints.map((val, idx) => {
      const x = padX + (idx / Math.max(chartPoints.length - 1, 1)) * (svgWidth - padX * 2)
      const y = svgHeight - padY - (val / maxVal) * (svgHeight - padY * 2)
      return {
        x,
        y,
        val,
        label: timeframeStats.labels[idx],
        bucket: timeframeStats.buckets[idx]
      }
    })
  }, [chartPoints, maxVal, timeframeStats.labels, timeframeStats.buckets])

  const compCoords = useMemo(() => {
    return chartCompPoints.map((val, idx) => {
      const x = padX + (idx / Math.max(chartCompPoints.length - 1, 1)) * (svgWidth - padX * 2)
      const y = svgHeight - padY - (val / maxVal) * (svgHeight - padY * 2)
      return { x, y }
    })
  }, [chartCompPoints, maxVal])

  const mainPath = useMemo(() => getCubicBezierPath(coords), [coords])
  const compPath = useMemo(() => getCubicBezierPath(compCoords), [compCoords])

  const areaPath = useMemo(() => {
    if (coords.length < 2) return ''
    const first = coords[0]
    const last = coords[coords.length - 1]
    return `${mainPath} L ${last.x},${svgHeight - padY} L ${first.x},${svgHeight - padY} Z`
  }, [mainPath, coords])

  // Filtered recent orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return orders.filter(
      (o) =>
        !q ||
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q))
    )
  }, [orders, searchQuery])

  // Real Top-selling products computed from actual order items
  const topSellers = useMemo(() => {
    const productSalesMap = {}
    orders.forEach((o) => {
      if (o.payment_status === 'paid' || o.status === 'completed' || o.status === 'to_ship' || o.payment_status === 'cod') {
        ;(o.order_items || []).forEach((item) => {
          const pid = item.product_id
          if (!pid) return
          if (!productSalesMap[pid]) {
            productSalesMap[pid] = {
              productId: pid,
              name: item.name,
              imageUrl: item.image_url,
              price: item.price,
              unitsSold: 0,
              revenue: 0
            }
          }
          productSalesMap[pid].unitsSold += item.quantity || 1
          productSalesMap[pid].revenue += Number(item.price || 0) * (item.quantity || 1)
        })
      }
    })

    const soldList = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold)
    if (soldList.length > 0) {
      return soldList.map((s) => {
        const prod = products.find((p) => p.id === s.productId)
        return {
          ...prod,
          id: s.productId,
          name: s.name || prod?.name,
          image_url: s.imageUrl || prod?.image_url,
          price: s.price || prod?.price,
          category: prod?.category || 'Atelier',
          stock: prod?.stock ?? 0,
          unitsSold: s.unitsSold,
          salesRevenue: s.revenue,
          isRealSeller: true
        }
      })
    }

    // Honest fallback if no orders have been placed yet: showcase catalog piece
    return products.slice(0, 5).map((p) => ({
      ...p,
      unitsSold: 0,
      salesRevenue: 0,
      isRealSeller: false
    }))
  }, [orders, products])

  const activeSpotlight = topSellers[spotlightIndex] || topSellers[0]

  const nextSpotlight = () => {
    setSpotlightIndex((prev) => (prev + 1) % Math.max(topSellers.length, 1))
  }

  const prevSpotlight = () => {
    setSpotlightIndex((prev) => (prev - 1 + topSellers.length) % Math.max(topSellers.length, 1))
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 rounded-full border-3 border-neutral-200 dark:border-neutral-800 border-t-neutral-950 dark:border-t-white animate-spin" />
        <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Loading store telemetry…
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Row 1: KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {/* Metric 1: Total products */}
        <Link
          to="/admin/products"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-950 transition-colors">
              <Package size={17} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {products.filter((p) => p.is_active).length} active
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total products</p>
          <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white mt-1">
            {stats.totalProducts}
          </p>
        </Link>

        {/* Metric 2: Completed order */}
        <Link
          to="/admin/orders?status=completed"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-950 transition-colors">
              <PackageCheck size={17} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              {orders.length > 0 ? `${Math.round((stats.completed / orders.length) * 100)}% of total` : '0%'}
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Completed orders</p>
          <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white mt-1">
            {stats.completed}
          </p>
        </Link>

        {/* Metric 3: Orders to ship & fulfillment */}
        <Link
          to="/admin/orders?status=to_ship"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-950 transition-colors">
              <Truck size={17} />
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                stats.codPending > 0
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : stats.toShip > 0
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {stats.codPending > 0
                ? `${stats.codPending} COD to approve`
                : stats.toShip > 0
                ? `${stats.toShip} to dispatch`
                : 'All clear'}
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Orders to ship</p>
          <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white mt-1">
            {stats.toShip}
          </p>
        </Link>

        {/* Metric 4: Paid Revenue */}
        <Link
          to="/admin/orders"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-950 transition-colors">
              <DollarSign size={17} />
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                timeframeStats.deltaPositive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {timeframeStats.deltaPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {timeframeStats.delta}
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Paid revenue</p>
          <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white mt-1">
            {money(stats.revenue)}
          </p>
        </Link>
      </div>

      {/* Row 2: Sales Report Hero Card with Dynamic Realtime Interactive Chart */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs relative overflow-hidden transition-colors">
        {/* Top Header of Chart */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Your sales report
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
              Look at your atelier transactions & volume history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 text-xs font-medium border border-neutral-200/60 dark:border-neutral-700">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetric === 'revenue'
                    ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Total Sales
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetric === 'orders'
                    ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Volume
              </button>
            </div>
          </div>
        </div>

        {/* Real Dynamic Headline Figure & Growth Delta */}
        <div className="flex flex-wrap items-baseline gap-3 mb-6">
          <span className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            {chartMetric === 'revenue'
              ? money(timeframeStats.currentTotalRevenue)
              : `${timeframeStats.currentTotalOrders} Order${timeframeStats.currentTotalOrders === 1 ? '' : 's'}`}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              timeframeStats.deltaPositive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
            }`}
          >
            {timeframeStats.deltaPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {timeframeStats.delta} {timeframeStats.subtext}
          </span>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {['1d', '7d', '30d', '12m', 'Max'].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf)
                setHoveredIndex(null)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Interactive Smooth SVG Line Chart */}
        <div className="relative w-full h-[220px] sm:h-[250px] select-none">
          {/* Subtle Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-4">
            <div className="w-full border-b border-dashed border-neutral-100 dark:border-neutral-800" />
            <div className="w-full border-b border-dashed border-neutral-100 dark:border-neutral-800" />
            <div className="w-full border-b border-dashed border-neutral-100 dark:border-neutral-800" />
            <div className="w-full border-b border-neutral-200/80 dark:border-neutral-700" />
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#09090b'} stopOpacity={isDark ? 0.12 : 0.08} />
                <stop offset="100%" stopColor={isDark ? '#ffffff' : '#09090b'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Gradient Fill under main line */}
            <path d={areaPath} fill="url(#chartAreaGrad)" />

            {/* Comparison secondary line (dashed, light gray) */}
            <path
              d={compPath}
              fill="none"
              stroke={isDark ? '#52525b' : '#d4d4d8'}
              strokeWidth="1.8"
              strokeDasharray="4 4"
            />

            {/* Primary line (solid ink dark) */}
            <path
              d={mainPath}
              fill="none"
              stroke={isDark ? '#fafafa' : '#09090b'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Vertex Dot */}
            {hoveredIndex !== null && coords[hoveredIndex] && (
              <g>
                <line
                  x1={coords[hoveredIndex].x}
                  y1={padY}
                  x2={coords[hoveredIndex].x}
                  y2={svgHeight - padY}
                  stroke={isDark ? '#71717a' : '#a1a1aa'}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={coords[hoveredIndex].x}
                  cy={coords[hoveredIndex].y}
                  r="6"
                  fill={isDark ? '#fafafa' : '#09090b'}
                  stroke={isDark ? '#18181b' : '#ffffff'}
                  strokeWidth="2.5"
                  className="shadow-md"
                />
              </g>
            )}
          </svg>

          {/* Interactive Hit areas for hover */}
          <div className="absolute inset-0 flex justify-between">
            {coords.map((c, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                className="flex-1 h-full cursor-pointer relative group"
              />
            ))}
          </div>

          {/* Real Telemetry Tooltip Card */}
          {hoveredIndex !== null && coords[hoveredIndex] && (
            <div
              className="absolute z-30 bg-neutral-950 dark:bg-neutral-800 text-white rounded-2xl px-4 py-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-transform duration-75 border border-neutral-800 dark:border-neutral-700"
              style={{
                left: `${(coords[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${(coords[hoveredIndex].y / svgHeight) * 100}%`
              }}
            >
              <p className="text-[11px] font-medium text-neutral-400">
                {coords[hoveredIndex].label} · {timeframeStats.label}
              </p>
              <p className="font-heading text-base font-bold text-white mt-0.5">
                {chartMetric === 'revenue'
                  ? money(coords[hoveredIndex].val)
                  : `${coords[hoveredIndex].val} Order${coords[hoveredIndex].val === 1 ? '' : 's'}`}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-neutral-300 mt-1">
                <span>
                  {coords[hoveredIndex].bucket?.orderCount || 0} Transaction
                  {(coords[hoveredIndex].bucket?.orderCount || 0) === 1 ? '' : 's'}
                </span>
                <span>•</span>
                <span>
                  {coords[hoveredIndex].bucket?.productCount || 0} Product
                  {(coords[hoveredIndex].bucket?.productCount || 0) === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between text-[11px] font-medium text-neutral-400 dark:text-neutral-500 pt-3 px-2 border-t border-neutral-100 dark:border-neutral-800">
          {timeframeStats.labels.map((lbl, idx) => (
            <span key={idx} className={hoveredIndex === idx ? 'text-neutral-950 dark:text-white font-semibold' : ''}>
              {lbl}
            </span>
          ))}
        </div>
      </section>

      {/* Row 3: Split Section (2/3 Left: Last Transaction / 1/3 Right: Product Spotlight) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Last Transactions Table */}
        <section className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            {/* Header with Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                  Last transaction
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Recent customer checkout orders in real time</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white w-36 sm:w-44"
                  />
                </div>
                <Link
                  to="/admin/orders"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <th className="pb-3 pl-2">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                        No transactions recorded yet. When customers complete checkout, their orders will appear here in real time.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 6).map((o) => {
                      const totalItems = (o.order_items || []).reduce(
                        (sum, item) => sum + (item.quantity || 1),
                        0
                      )
                      return (
                        <tr
                          key={o.id}
                          onClick={() => navigate(`/admin/orders?order=${o.id}`)}
                          className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 pl-2 font-mono text-xs font-medium text-neutral-900 dark:text-neutral-200">
                            {o.order_number || `#ORD-${o.id.slice(0, 6)}`}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                                {o.customer_name || 'Guest Client'}
                              </p>
                              {isCodOrder(o) && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  COD
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                              {totalItems} item{totalItems === 1 ? '' : 's'}
                            </p>
                          </td>
                          <td className="py-3.5 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                            {formatDate(o.created_at)}
                          </td>
                          <td className="py-3.5 text-xs font-semibold tabular-nums text-neutral-900 dark:text-white text-right">
                            {money(o.total)}
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <StatusBadge status={o.status} order={o} />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Atelier Spotlight Card (Real Top Sellers or Featured Item) */}
        <section className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                  {activeSpotlight?.isRealSeller ? 'Top Performer' : 'Catalog Showcase'}
                </span>
                <span className="text-base">{activeSpotlight?.isRealSeller ? '🎉' : '✨'}</span>
              </div>
              {topSellers.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevSpotlight}
                    className="p-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label="Previous product"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={nextSpotlight}
                    className="p-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label="Next product"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-5 leading-relaxed">
              {activeSpotlight?.isRealSeller
                ? 'Your highest velocity item based on customer checkout orders.'
                : 'Awaiting customer transactions. Highlighting featured inventory:'}
            </p>

            {/* Featured Product Card Visual */}
            {activeSpotlight ? (
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700 text-center space-y-3">
                <div className="w-full h-36 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700 overflow-hidden flex items-center justify-center p-3">
                  {activeSpotlight.image_url ? (
                    <img
                      src={activeSpotlight.image_url}
                      alt={activeSpotlight.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Package size={40} className="text-neutral-300 dark:text-neutral-600" />
                  )}
                </div>

                <div>
                  <p className="font-heading text-sm font-bold text-neutral-950 dark:text-white truncate px-2">
                    {activeSpotlight.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                    {money(activeSpotlight.price)} • {activeSpotlight.category || 'Atelier'}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 inline-block px-2 py-0.5 rounded-full mt-2">
                    {activeSpotlight.isRealSeller
                      ? `${activeSpotlight.unitsSold} units sold (${money(activeSpotlight.salesRevenue)})`
                      : activeSpotlight.stock > 0
                      ? `${activeSpotlight.stock} units available`
                      : 'Sold out'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">
                No active spotlight product found.
              </div>
            )}
          </div>

          {/* Quick Restock Alert Box inside Right Card */}
          {lowStock.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                  Restock priority
                </span>
                <Link to="/admin/products?filter=low" className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white underline">
                  Restock
                </Link>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {lowStock[0].name} ({lowStock[0].stock} remaining)
              </p>
            </div>
          )}
        </section>
      </div>

      {/* AI Atelier Intelligence & Operations Telemetry */}
      <section className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                  Zion AI Atelier Intelligence
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {isAiConfigured ? 'Gemini Live' : 'Local Mode'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                pgvector semantic indexing, review consensus cache, and automated return vision triage
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(syncingEmbeddings)}
            onClick={handleDashboardSyncEmbeddings}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60"
          >
            {syncingEmbeddings ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{syncingEmbeddings}</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Sync Vector Index</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
              pgvector Search Index
            </span>
            <p className="font-heading text-2xl font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
              {products.filter((p) => Boolean(p.embedding)).length} / {products.length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              768-dim product embeddings
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
              AI Review Consensus
            </span>
            <p className="font-heading text-2xl font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
              {products.filter((p) => Boolean(p.ai_review_summary)).length} / {products.length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Pre-warmed Pros &amp; Cons (0ms load)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
              AI Return Vision Triage
            </span>
            <p className="font-heading text-2xl font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
              {refundTriages.length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {refundTriages.filter((r) => r.status === 'auto_approved').length} auto-verified ·{' '}
              {refundTriages.filter((r) => r.status !== 'auto_approved').length} manual
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
              AI Shopper Queries
            </span>
            <p className="font-heading text-2xl font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
              {aiLogs.length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Logged across Stylist &amp; Search
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
