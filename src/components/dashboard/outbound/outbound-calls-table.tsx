import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const calls = [
  { from: "+393399908011", to: "+393667247352", date: "5/31/2025 - 09:16 PM", duration: 15, status: "Unreachable" },
  { from: "+393399908011", to: "+393515066598", date: "5/31/2025 - 09:16 PM", duration: 6, status: "Unreachable" },
  { from: "+393399908011", to: "+393279429499", date: "5/31/2025 - 09:16 PM", duration: 5, status: "Unreachable" },
  { from: "+393399908011", to: "+393298752719", date: "5/31/2025 - 09:16 PM", duration: 3, status: "Unreachable" },
  { from: "+393399908011", to: "+393338413185", date: "5/31/2025 - 09:15 PM", duration: 3, status: "Unreachable" },
]

export default function OutboundCallsTable() {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-black">Outbound Calls</CardTitle>
        <Button variant="link" className="text-blue-600 p-0">
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">From</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">To</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Duration</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Tags</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Events</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-sm text-black">{call.from}</td>
                  <td className="py-3 px-2 text-sm text-black">{call.to}</td>
                  <td className="py-3 px-2 text-sm text-black">{call.date}</td>
                  <td className="py-3 px-2 text-sm text-black">{call.duration}</td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {call.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
