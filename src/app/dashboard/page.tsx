import { SalesCards } from "@/components/dashboard/sales-cards";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { AiOptimizer } from "@/components/dashboard/ai-optimizer";

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <SalesCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-12 md:col-span-4">
            <ConversionFunnel />
          </div>
          <div className="col-span-12 md:col-span-3">
            <PaymentMethods />
          </div>
        </div>
        <AiOptimizer />
      </div>
    </>
  );
}
