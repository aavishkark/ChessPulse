import "./hero.css";

const Hero = () => {
  return (
    <div className="hero-root">

      <section className="hero-section">
        <div className="hero-bgAura"></div>

        <div className="hero-inner">

          <div className="hero-left">
            <p className="hero-pretitle">Spectate Chess in new way</p>

            <h1 className="hero-title">
              <span className="hero-gradientText">Customize</span> Your Chess Experience
            </h1>

            <p className="hero-description">
                Discover a world where you can tailor your chess journey to your unique style.
                Personalized themes to adaptive tools, ChessPulse puts you in control of your chess experience.
            </p>

            <div className="hero-ctaWrapper">
              <div className="hero-ctaGlow"></div>
              <a href="#" className="hero-cta">Start Exploring Tournaments</a>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-imageGlow"></div>
            <img
              className="hero-illustration"
              src="src/assets/hero.png"
              alt="illustration"
            />
          </div>

        </div>
      </section>

    </div>
  );
};

export default Hero;