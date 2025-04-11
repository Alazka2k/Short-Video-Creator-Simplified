import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Narravid',
  description: 'Create and manage your video content',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 