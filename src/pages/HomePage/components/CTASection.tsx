import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Leaf, ArrowRight, Sparkles, Play } from "lucide-react";
import { motion } from "framer-motion";

const PARTICLE_COUNT = 20;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 3 + Math.random() * 2,
  delay: Math.random() * 2,
}));

function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop"
          alt="Farm landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/95 via-green-800/90 to-emerald-900/95" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400/40 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Decorative shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] opacity-10"
      >
        <div className="w-full h-full rounded-full border border-white/20" />
        <div className="absolute inset-8 rounded-full border border-white/15" />
        <div className="absolute inset-16 rounded-full border border-white/10" />
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 mb-8 border border-white/20"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-white text-sm font-medium">
              Bắt đầu miễn phí ngay hôm nay
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
          >
            Sẵn sàng
            <span className="relative inline-block mx-4">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                chuyển đổi số
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full origin-left"
              />
            </span>
            <br />
            cho nông trại của bạn?
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-green-100 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Tham gia cùng hơn{" "}
            <span className="text-white font-semibold">500+ nông trại</span>{" "}
            đang sử dụng FarmOS để tối ưu hóa sản xuất, giảm 30% chi phí và phát
            triển bền vững.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-10 py-7 text-lg font-semibold shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 group"
            >
              <Link
                to="/register"
                className="flex items-center gap-2"
              >
                <Leaf className="w-5 h-5" />
                Đăng ký miễn phí
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-full px-10 py-7 text-lg backdrop-blur-md group"
            >
              <Link
                to="/contact"
                className="flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Xem Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            {[
              { icon: "✓", text: "Không cần thẻ tín dụng" },
              { icon: "✓", text: "Dùng thử 14 ngày" },
              { icon: "✓", text: "Hủy bất cứ lúc nào" },
              { icon: "✓", text: "Hỗ trợ 24/7" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 text-green-200"
              >
                <span className="text-green-400">{item.icon}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {[
              { value: "500+", label: "Nông trại" },
              { value: "30%", label: "Giảm chi phí" },
              { value: "24/7", label: "Hỗ trợ" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10"
              >
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-green-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
