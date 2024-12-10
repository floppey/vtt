import { VttWrapper } from "@/components/VttWrapper";
import ProviderOfAllThings from "@/context/ProviderOfAllThings";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const channelId = params.slug[0];

  return (
    <ProviderOfAllThings channelId={channelId}>
      <VttWrapper />
    </ProviderOfAllThings>
  );
}
