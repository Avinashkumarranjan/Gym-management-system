import React from 'react';
import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
import Features from '../components/home/Features';
import MembershipPreview from '../components/home/MembershipPreview';
import FitnessToolsPreview from '../components/home/FitnessToolsPreview';
import TrainersPreview from '../components/home/TrainersPreview';
import CTA from '../components/home/CTA';

const Home = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <Features />
      <MembershipPreview />
      <FitnessToolsPreview />
      <TrainersPreview />
      <CTA />
    </div>
  );
};

export default Home;
