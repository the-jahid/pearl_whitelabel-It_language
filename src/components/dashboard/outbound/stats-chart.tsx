"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { date: "30 May", value: 900 },
  { date: "31 May", value: 800 },
  { date: "Jun 25", value: 400 },
]

export default function StatsChart() {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-black">Total Usage (Minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
