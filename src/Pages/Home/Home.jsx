import EvalSection from "../../Components/EvalSection/EvalSection";
import Hero from "../../Components/Hero/Hero";
import LiveGame from "../../Components/LiveGame/LiveGame";
import Rankings from "../../Components/Rankings/Rankings";

export default function Home() {
  return (
    <>
      <Hero />
      <EvalSection />
      <LiveGame />
      <Rankings/>
    </>
  );
}
