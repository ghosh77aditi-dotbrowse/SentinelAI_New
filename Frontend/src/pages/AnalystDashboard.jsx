import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'

import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,PieChart,Pie,Cell} from 'recharts'

import {
  Users,
  ShieldAlert,
  Radar
} from 'lucide-react'

import StatCard from '../components/StatCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import RiskGauge from '../components/RiskGauge.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {

  const { user } = useAuth()

  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const response = await axiosClient.get("/dashboard/analyst")

        setDashboardData(response.data)

      }

      catch (err) {

        console.error(err)

      }

    }

    loadDashboard()

  }, [])

  const topRisk = dashboardData?.users ?? []

  const alerts = dashboardData?.recentActivities ?? []

  const realRiskDistribution =
    dashboardData
      ? dashboardData.riskDistribution.map(item => ({

          name: item._id,

          value: item.count,

          color:
            item._id === "LOW"
              ? "#33D6C0"
              : item._id === "MEDIUM"
              ? "#FFC857"
              : item._id === "HIGH"
              ? "#FF8A5B"
              : "#FF4D6D"

        }))
      : []

  const averageRisk =
    topRisk.length === 0
      ? 0
      : Math.round(

          topRisk.reduce(

            (sum, u) => sum + u.riskScore,

            0

          ) / topRisk.length

        )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted">
          Welcome back, <span className="text-ink font-medium">
          {user?.username}
          </span>. Here's the current risk posture for {user?.companyName}.
        </p>
      </div>

      {/* KPI row */}
<div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
  {/* Featured card — avg. org risk score, now the visual anchor of the row */}
  <div className="card p-9 flex items-center gap-5 xl:col-span-1">
    <RiskGauge
      score={averageRisk}
      size={97}
      strokeWidth={7}
    />
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Avg. org risk score</p>
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-3xl font-sans text-muted">{averageRisk}</span>
        <span className="text-xs font-sans text-ink">
    Current average
</span>
      </div>
      <p className="text-xs text-muted mt-1">7-day rolling average</p>
    </div>
  </div>

  {/* Remaining three, smaller, stacked beside it */}
  <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">

  <StatCard
    icon={Users}
    label="High Risk Users"
    value={dashboardData?.summary?.highRiskUsers ?? 0}
    delta=""
    deltaTone="signal"
    sublabel="Currently under investigation"
  />

  <StatCard
    icon={ShieldAlert}
    label="Critical Alerts"
    value={dashboardData?.summary?.criticalAlerts ?? 0}
    delta=""
    deltaTone="risk"
    sublabel="Highest priority alerts"
  />

  <StatCard
    icon={Radar}
    label="Detected Anomalies"
    value={dashboardData?.summary?.totalAnomalies ?? 0}
    delta=""
    deltaTone="risk"
    sublabel="Across uploaded logs"
  />

</div>
</div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-ink text-sm">
                Activity Trend (7 Days)
              </h3>

              <p className="text-xs text-faint">
                User activities recorded each day
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dashboardData?.activityTrend ?? []}>
              <CartesianGrid stroke="#1E2836" vertical={false} />
              <XAxis dataKey="_id" stroke="#5C6980" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#5C6980" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="totalActivities" name="Activities" stroke="#33D6C0" strokeWidth={2} dot={false} activeDot={{ r: 5 }} fill="none" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-7">
          <h3 className="font-display font-semibold text-ink text-sm mb-1">Identity risk distribution</h3>
          <p className="text-xs text-muted mb-4">
    Current company risk distribution
</p>
          <ResponsiveContainer width="90%" height={200}>
            <PieChart>
              <Pie
                data={realRiskDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {realRiskDistribution.map((r) => (
                  <Cell key={r.name} fill={r.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
         <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
          {realRiskDistribution.map((r) => (
           <div
               key={r.name}
               className="grid grid-cols-[10px_1fr_36px] items-center text-xs"
               >
              <span
                  className="w-1 h-5 rounded-full"
                    style={{ backgroundColor: r.color }}
              />
               <span className="text-muted ml-2">{r.name}</span>
               <span className="text-right font-mono text-ink">
                 {r.value}
                </span>
            </div>
           ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Top risk users */}
        <div className="card p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink text-sm">Users requiring attention</h3>
            <Link to="/risk-analysis" className="text-xs text-signal hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {topRisk.map((u) => (
  <Link
    to={`/risk-analysis/${u.userId}`}
    key={u.userId}
    className="flex items-center gap-4 py-2.5 px-2 rounded-lg hover:bg-elevated transition-colors"
  >
    <div className="w-10 h-10 rounded-xl bg-elevated2 flex items-center justify-center text-xs font-semibold text-ink shrink-0">
      {u.employeeName
        ?.split(" ")
        .map((n) => n[0])
        .join("")}
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm text-ink font-medium truncate">
        {u.employeeName}
      </p>

      <p className="text-xs text-faint">
        Employee
      </p>
    </div>

    <RiskBadge level={u.riskLevel} />

    <span className="font-mono text-sm text-ink w-8 text-right">
      {u.riskScore}
    </span>
  </Link>
))}
          </div>
        </div>

{/* Recent Activities */}
<div className="card p-6">
  <h3 className="font-display font-semibold text-ink text-sm mb-4">
    Recent Activities
  </h3>

  {alerts.length === 0 ? (
    <p className="text-sm text-muted">
      No recent activities found.
    </p>
  ) : (
    alerts.slice(0, 5).map((a, index) => (
      <div key={index} className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center w-14 h-14 shrink-0">
          <RiskGauge
            score={
              topRisk.find(
                (u) => u.employeeName === a.employeeName
              )?.riskScore || 0
            }
            size={52}
            strokeWidth={4}
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-ink leading-tight">
            Activity Log
          </p>

          <p className="text-sm text-faint mt-1">
            {a.employeeName} ·{" "}
            {new Date(a.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    ))
  )}
</div>
</div> {/* End grid */}

    </div> 
  )
}