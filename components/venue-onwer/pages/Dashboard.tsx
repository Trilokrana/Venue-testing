import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const VenueOwnerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Owner Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["Today Bookings", "Today Earnings", "Monthly Revenue", "Rating"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="text-sm">{item}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">--</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((b) => (
            <div key={b} className="flex justify-between items-center border p-3 rounded-xl">
              <div>
                <p className="font-medium">User #{b}</p>
                <p className="text-sm text-muted-foreground">2 hrs booking</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge>Upcoming</Badge>
                <Button size="sm">Accept</Button>
                <Button size="sm" variant="destructive">
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Graph goes here</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default VenueOwnerDashboard
