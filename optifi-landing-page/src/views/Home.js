import React from 'react';
// import sections
import Hero from '../components/sections/Hero';
import FeaturesTiles from '../components/sections/FeaturesTiles';
import HowItWorks from '../components/sections/HowItWorks';
import HowItWorksTwo from '../components/sections/HowItWorksTwo';
import HowItWorksThree from '../components/sections/HowItWorksThree';
import FAQ from '../components/sections/FAQ';
import Footer from '../components/sections/Footer';

const Home = () => {

  return (
    <>
      <Hero  />
      <FeaturesTiles />
      <HowItWorks invertMobile imageFill  />
      <HowItWorksTwo invertMobile imageFill  />
      <HowItWorksThree invertMobile imageFill  />
      <FAQ />
      <Footer />
    </>
  );
}

export default Home;