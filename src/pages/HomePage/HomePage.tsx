import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import UserRolesSection from "./components/UserRolesSection";
import DashboardPreviewSection from "./components/DashboardPreviewSection";
import StatisticsSection from "./components/StatisticsSection";
import TestimonialsSection from "./components/TestimonialsSection";
import PricingSection from "./components/PricingSection";
import FAQSection from "./components/FAQSection";
import CTASection from "./components/CTASection";

function HomePage() {
  return (
    <main className="overflow-hidden">
      {/* 1. Hero - Main headline and CTA */}
      <HeroSection />

      {/* 2. Problem/Solution - Why FarmOS exists */}
      <ProblemSection />

      {/* 3. Features - Key capabilities */}
      <FeaturesSection />

      {/* 4. How It Works - Process/workflow */}
      <HowItWorksSection />

      {/* 5. User Roles - Who uses FarmOS */}
      <UserRolesSection />

      {/* 6. Dashboard Preview - IoT monitoring showcase */}
      <DashboardPreviewSection />

      {/* 7. Statistics/Impact - Numbers that matter */}
      <StatisticsSection />

      {/* 8. Testimonials - Social proof */}
      <TestimonialsSection />

      {/* 9. Pricing - Service plans */}
      <PricingSection />

      {/* 10. FAQ - Common questions */}
      <FAQSection />

      {/* Final CTA - Call to action */}
      <CTASection />
    </main>
  );
}

export default HomePage;
