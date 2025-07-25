import { PricingComponent } from '@/components/marketing/pricing/PricingComponent';
import { notFound } from 'next/navigation';

async function getPricingData() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    
    const [plansRes, tokenPackagesRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/subscription/plans`, { cache: 'no-store' }), // Fetch all plans
      fetch(`${apiBaseUrl}/api/subscription/token-packages`, { cache: 'no-store' })
    ]);

    if (!plansRes.ok) {
      throw new Error(`Failed to fetch plans: ${plansRes.statusText}`);
    }
    if (!tokenPackagesRes.ok) {
      throw new Error(`Failed to fetch token packages: ${tokenPackagesRes.statusText}`);
    }

    const plans = await plansRes.json();
    const tokenPackages = await tokenPackagesRes.json();

    return { plans, tokenPackages };
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    return null; // Return null to handle the error gracefully
  }
}

export default async function PricingPage() {
  const pricingData = await getPricingData();

  if (!pricingData) {
    // This could render a more user-friendly error component
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">
          Could Not Load Pricing Information
        </h1>
        <p className="text-muted-foreground">
          There was an issue fetching our plans. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <main>
      <PricingComponent plans={pricingData.plans} tokenPackages={pricingData.tokenPackages} />
    </main>
  );
} 