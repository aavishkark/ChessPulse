import EvalSection from "../../Components/EvalSection/EvalSection";
import Hero from "../../Components/Hero/Hero";
import LiveGame from "../../Components/LiveGame/LiveGame";
import LiveGameViewer from "../../Components/LiveGame/LiveGame";
import LiveGameParent from "../../Components/LiveGame/LiveGameParent";


export default function Home() {
  return (
    <>
      <Hero />
      <EvalSection />
      <LiveGame />
    </>
  );
}
