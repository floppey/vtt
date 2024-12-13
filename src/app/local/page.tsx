import { LocalVttWrapper } from "@/components/LocalVttWrapper";
import LocalProviderOfAllThings from "@/context/LocalProviderOfAllThings";

export default function Page() {
  return (
    <LocalProviderOfAllThings>
      <LocalVttWrapper />
    </LocalProviderOfAllThings>
  );
}
