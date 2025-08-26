import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Call Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">33.8%</div>
            <p className="text-sm text-gray-600 mt-2">130 successful out of 385 total calls</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Average Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">7.2 min</div>
            <p className="text-sm text-gray-600 mt-2">Based on successful calls</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Peak Call Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">9-10 PM</div>
            <p className="text-sm text-gray-600 mt-2">Most active calling period</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Call Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-black">Unreachable</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "60%" }}></div>
                </div>
                <span className="text-sm text-gray-600">60%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-black">Call Unsuccessful</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                </div>
                <span className="text-sm text-gray-600">40%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
