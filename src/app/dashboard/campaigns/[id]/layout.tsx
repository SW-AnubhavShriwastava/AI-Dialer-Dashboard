import { Metadata } from 'next'
import { headers } from 'next/headers'

export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaigns/${params.id}`)
    const campaign = await response.json()

    return {
      title: `${campaign.name} - Campaign Details | SNB Connect`,
      description: campaign.description || 'Campaign management in SNB Connect'
    }
  } catch (error) {
    return {
      title: 'Campaign Details | SNB Connect',
      description: 'Campaign management in SNB Connect'
    }
  }
}

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 