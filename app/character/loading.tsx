import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

const CharacterLoading = () => {
  return <PageLoader icon={<GameIcon name="mage" size={32} />} text="Loading characters…" />;
};

export default CharacterLoading;
