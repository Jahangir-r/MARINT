import HomeNav from "../components/home/HomeNav";
import HeroStory from "../components/home/HeroStory";
import CaspianInteractiveStory from "../components/home/CaspianInteractiveStory";
import DataFusion from "../components/home/DataFusion";
import DarkVesselStory from "../components/home/DarkVesselStory";
import CapabilitiesStory from "../components/home/CapabilitiesStory";
import GlobalScale from "../components/home/GlobalScale";
import FinalCta from "../components/home/FinalCta";
import Footer from "../components/home/Footer";
import HomeThemeSwitch from "../components/home/HomeThemeSwitch";

export default function Home() {
  // The homepage now respects the same app-wide light/dark preference as
  // Operations (see lib/theme.ts) instead of hard-locking to dark — every
  // section below reads its cinematic colors from the --color-home-*
  // tokens (index.css), which resolve to the original approved dark
  // palette under [data-theme="dark"] and a new light palette otherwise.
  return (
    <div className="bg-home-bg">
      <HomeNav />
      <HeroStory />
      <CaspianInteractiveStory />
      <DataFusion />
      <DarkVesselStory />
      <CapabilitiesStory />
      <GlobalScale />
      <FinalCta />
      <Footer />
      <HomeThemeSwitch />
    </div>
  );
}
