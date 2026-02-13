import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

const Loading = () => {
  return <PageLoader icon={<GameIcon name="fights" size={32} />} text="Loading…" />;
};

export default Loading;
