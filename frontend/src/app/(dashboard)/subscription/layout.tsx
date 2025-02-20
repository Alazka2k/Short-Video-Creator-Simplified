import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription - Video Creator',
  description: 'Manage your subscription and tokens',
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 