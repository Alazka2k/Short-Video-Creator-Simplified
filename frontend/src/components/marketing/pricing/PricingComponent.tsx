'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Star, ChevronDown } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StripeCheckoutButton } from '@/components/shared/buttons/StripeCheckoutButton';
import { cn } from '@/lib/utils';
import faqData from '@/data/faq/pricing-faq.json';

// Type Definitions
interface MarketingFeature {
  title: string;
  text: string;
  highlight: boolean;
}

interface PlanMarketingDescription {
  tier_name?: string;
  description?: string;
  features?: MarketingFeature[];
  is_popular?: boolean;
}

interface Plan {
  plan_id: number;
  plan_name: string;
  billing_frequency: string;
  price: string;
  monthly_price: string;
  annual_price: string;
  monthly_token_allocation: number;
  stripe_price_id: string;
  marketing_description?: PlanMarketingDescription;
  tier_id: number;
  active: boolean;
}

interface TokenPackageMarketingDescription {
  name?: string;
  description?: string;
  features?: string[];
}

interface TokenPackage {
  package_id: number;
  package_name: string;
  token_allocation: number;
  price: string;
  stripe_price_id: string;
  marketing_description?: TokenPackageMarketingDescription;
}

// Sub-Component: BillingToggle
interface BillingToggleProps {
  isYearly: boolean;
  onToggle: (checked: boolean) => void;
}
const BillingToggle = ({ isYearly, onToggle }: BillingToggleProps) => (
  <div className="flex items-center justify-center space-x-4 mb-10">
    <Label htmlFor="billing-toggle" className={cn('text-lg', !isYearly ? 'text-primary' : 'text-muted-foreground')}>
      Monthly
    </Label>
    <Switch
      id="billing-toggle"
      checked={isYearly}
      onCheckedChange={onToggle}
      className="scale-125"
      aria-label="Toggle between monthly and yearly billing"
    />
    <Label htmlFor="billing-toggle" className={cn('text-lg', isYearly ? 'text-primary' : 'text-muted-foreground')}>
      Yearly <span className="text-green-600 font-semibold">(Save up to 20%)</span>
    </Label>
  </div>
);

// Sub-Component: PlanCard
interface PlanCardProps {
  plan: Plan;
  isYearly: boolean;
  isAuthenticated: boolean;
  currentUserPlanId: number | null | undefined;
  monthlyPlans: Plan[];
}
const PlanCard = ({ plan, isYearly, isAuthenticated, currentUserPlanId, monthlyPlans }: PlanCardProps) => {
  const isPopular = plan.marketing_description?.is_popular ?? false;
  const isCurrentUserPlan = plan.plan_id === currentUserPlanId;
  const isDeactivated = !plan.active;
  const monthlyPlanForYearly = isYearly ? monthlyPlans.find(p => p.tier_id === plan.tier_id && p.billing_frequency === 'monthly') : null;

  return (
    <motion.div
      key={plan.plan_id}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.random() * 0.2 }}
      className="h-full"
    >
      <Card className={cn(
        'h-full flex flex-col',
        !isCurrentUserPlan && !isDeactivated && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-2',
        isPopular && !isCurrentUserPlan && !isDeactivated && 'border-primary border-2 shadow-lg shadow-primary/20',
        isCurrentUserPlan && 'border-accent bg-accent/5',
        isDeactivated && 'bg-muted border-border opacity-70'
      )}>
        <CardHeader className="text-center relative pt-8 pb-4">
          {isCurrentUserPlan && (
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-accent text-accent-foreground text-xs font-bold py-1 px-3 rounded-full">
              Current Plan
            </div>
          )}
          {isPopular && !isCurrentUserPlan && !isDeactivated && (
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3"/> Most Popular
            </div>
          )}
          <CardTitle className={cn("text-2xl font-bold", isDeactivated && "text-gray-500")}>{plan.marketing_description?.tier_name || plan.plan_name}</CardTitle>
          <p className={cn("text-sm h-10 mt-2", isDeactivated ? "text-gray-500" : "text-muted-foreground")}>{plan.marketing_description?.description}</p>
          <div className={cn("text-4xl font-bold pt-2 flex items-baseline justify-center gap-2", isDeactivated ? "text-gray-500" : "text-foreground")}>
            {isYearly && monthlyPlanForYearly && plan.tier_id !== 1 && (
              <span className="text-2xl line-through">€{monthlyPlanForYearly.price}</span>
            )}
            <span>
              €{isYearly ? plan.monthly_price : plan.price}
            </span>
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </div>
           {isYearly && plan.tier_id !== 1 && (
              <p className="text-xs text-muted-foreground h-4">Billed as €{plan.annual_price} per year</p>
            )}
            {isYearly && plan.tier_id === 1 && (
              <div className="h-4" /> // Placeholder for alignment
            )}
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between p-6">
          <ul className="space-y-3 text-left mb-6">
            {plan.marketing_description?.features?.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                {!feature.title.startsWith('Everything in') && (
                  <Check className={cn("w-5 h-5 flex-shrink-0 mt-1", isDeactivated ? "text-gray-400" : "text-primary")} />
                )}
                <span className={cn(
                    'flex-1',
                    !isDeactivated && !isCurrentUserPlan && feature.highlight ? 'font-semibold text-foreground' : 
                    feature.title.startsWith('Everything in') ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}>
                    {feature.title}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
             {isAuthenticated ? (
              <StripeCheckoutButton
                priceId={plan.stripe_price_id}
                planId={plan.plan_id}
                type="subscription"
                variant={isPopular && !isCurrentUserPlan && !isDeactivated ? 'default' : 'outline'}
                className="w-full"
                disabled={isCurrentUserPlan || isDeactivated || plan.plan_id === 1}
              >
                {isCurrentUserPlan ? 'Your Current Plan' : isDeactivated ? 'Coming Soon' : (plan.plan_id === 1 ? 'Free Tier' : 'Get Started')}
              </StripeCheckoutButton>
            ) : (
              <Button asChild className="w-full" variant={isPopular && !isDeactivated ? 'default' : 'outline'} disabled={isDeactivated}>
                {isDeactivated ? (
                    <span>Coming Soon</span>
                ) : (
                    <Link href={plan.plan_id === 1 ? '/signup' : `/signup?plan=${plan.stripe_price_id}`}>
                      Get Started
                    </Link>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sub-Component: TokenPackageCard
interface TokenPackageCardProps {
  pkg: TokenPackage;
  isAuthenticated: boolean;
}
const TokenPackageCard = ({ pkg, isAuthenticated }: TokenPackageCardProps) => (
    <Card key={pkg.package_id} className="text-center flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
    <CardHeader>
      <CardTitle>{pkg.marketing_description?.name || pkg.package_name}</CardTitle>
      <p className="text-sm text-muted-foreground h-10 mt-2">{pkg.marketing_description?.description}</p>
    </CardHeader>
    <CardContent className="flex-grow flex flex-col justify-end">
       <div className="text-4xl font-bold text-foreground mb-4">€{pkg.price}</div>
       <ul className="space-y-2 text-left mb-6 text-sm text-muted-foreground">
        {pkg.marketing_description?.features?.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {isAuthenticated ? (
        <StripeCheckoutButton
          priceId={pkg.stripe_price_id}
          type="token_package"
          packageId={String(pkg.package_id)}
          className="w-full"
        >
          Purchase Now
        </StripeCheckoutButton>
      ) : (
        <Button asChild className="w-full">
          <Link href="/signup?redirect=/pricing">
            Sign Up to Purchase
          </Link>
        </Button>
      )}
    </CardContent>
  </Card>
);

const FaqSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const { pricing_faq: faqs } = faqData;

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-20">
      <h2 className="text-3xl font-bold text-center tracking-tighter mb-8">Frequently Asked Questions</h2>
      <div className="w-full max-w-3xl mx-auto border-t">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b">
            <button
              onClick={() => handleToggle(i)}
              className="w-full flex justify-between items-center text-left py-4 px-2 hover:bg-muted/50 transition-colors"
            >
              <span className="font-semibold">{faq.question}</span>
              <ChevronDown className={cn("transform transition-transform duration-300", openIndex === i ? 'rotate-180' : '')} />
            </button>
            {openIndex === i && (
              <div className="pb-4 px-2 text-muted-foreground space-y-2">
                {faq.answer.includes(':') && faq.question.toLowerCase().includes('tokens') ? (() => {
                    const firstColonIndex = faq.answer.indexOf(':');
                    const intro = faq.answer.substring(0, firstColonIndex + 1);
                    const listStr = faq.answer.substring(firstColonIndex + 1);
                    const listItems = listStr.split(', ');
                    return (
                        <>
                            <p>{intro}</p>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                {listItems.map((item, index) => (
                                    <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </>
                    )
                })() : (
                    <p>{faq.answer}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CtaSection = () => (
    <div className="text-center mt-20 p-10 bg-card border rounded-lg shadow-sm">
        <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to transform your content creation?</h2>
        <p className="text-lg text-muted-foreground mb-8">Start with our Free Tier and experience the power of AI-driven storytelling. Upgrade anytime.</p>
        <div className="flex justify-center gap-4">
            <Button asChild size="lg">
                <Link href="/signup">Start Creating Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Us</Link>
            </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">*No payment required for Free Tier</p>
    </div>
)


// Main Component
interface PricingComponentProps {
  plans: Plan[];
  tokenPackages: TokenPackage[];
}

export function PricingComponent({ plans, tokenPackages }: PricingComponentProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  const monthlyPlans = plans.filter((p) => p.billing_frequency === 'monthly');
  const yearlyPlans = plans.filter((p) => p.billing_frequency === 'yearly');
  const freePlan = monthlyPlans.find(p => p.plan_id === 1);

  const displayedPlans = isYearly 
    ? freePlan ? [freePlan, ...yearlyPlans] : yearlyPlans
    : monthlyPlans;
  
  const currentUserPlanId = user?.subscriptionPlanId;

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Find the Perfect Plan
        </h1>
        <p className="text-lg text-muted-foreground">
          Whether you're just starting out or scaling up, we have a plan that fits your content creation needs.
        </p>
      </div>

      <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch justify-center">
        {displayedPlans.map((plan) => (
          <PlanCard 
            key={plan.plan_id}
            plan={plan}
            isYearly={isYearly}
            isAuthenticated={isAuthenticated}
            currentUserPlanId={currentUserPlanId}
            monthlyPlans={monthlyPlans}
          />
        ))}
      </div>

       <div id="token-packages" className="text-center mt-20">
        <h2 className="text-3xl font-bold tracking-tighter mb-4">One-Time Token Packs</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Need a little extra for a big project? Top up your account with a one-time purchase. Tokens never expire.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 items-stretch">
        {tokenPackages.map(pkg => (
          <TokenPackageCard 
            key={pkg.package_id}
            pkg={pkg}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <FaqSection />
      <CtaSection />
    </div>
  );
} 