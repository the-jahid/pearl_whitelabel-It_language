import CallsPage from "@/components/dashboard/outbound/calls-page"
import LeadsPage from "@/components/dashboard/outbound/leads-page"
import OverviewPage from "@/components/dashboard/outbound/overview-page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  return (
    /* Create a dedicated scrolling container for this page */
    <div className="relative h-[100svh] w-full overflow-y-auto bg-white text-black">
      <div className="mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <Tabs defaultValue="overview" className="w-full">
          {/* Sticky, responsive tab bar */}
          <div className="sticky top-0 z-10 -mx-3 sm:-mx-4 lg:-mx-6 mb-4 sm:mb-6 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <TabsList className="flex w-full gap-2 overflow-x-auto rounded-lg border bg-gray-50 p-1">
              <TabsTrigger
                value="overview"
                className="flex-1 min-w-[8rem] whitespace-nowrap data-[state=active]:bg-white"
              >
                Panoramica
              </TabsTrigger>
              <TabsTrigger
                value="leads"
                className="flex-1 min-w-[8rem] whitespace-nowrap data-[state=active]:bg-white"
              >
                Lead
              </TabsTrigger>
              <TabsTrigger
                value="calls"
                className="flex-1 min-w-[8rem] whitespace-nowrap data-[state=active]:bg-white"
              >
               Chiamate
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <TabsContent value="overview" className="mt-0 sm:mt-2">
            <OverviewPage />
          </TabsContent>

          <TabsContent value="leads" className="mt-0 sm:mt-2">
            <LeadsPage />
          </TabsContent>

          <TabsContent value="calls" className="mt-0 sm:mt-2 pb-8">
            <CallsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
