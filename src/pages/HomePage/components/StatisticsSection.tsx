import { TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 500,
    suffix: "+",
    label: "Nông trại sử dụng",
    description: "Trên khắp các tỉnh thành",
    trend: "up",
    trendValue: "+25%",
    icon: "🌾",
  },
  {
    value: 30,
    suffix: "%",
    label: "Giảm chi phí vận hành",
    description: "Nhờ tối ưu hóa quy trình",
    trend: "down",
    trendValue: "-30%",
    icon: "💰",
  },
  {
    value: 2,
    suffix: "x",
    label: "Tăng năng suất",
    description: "So với canh tác truyền thống",
    trend: "up",
    trendValue: "+100%",
    icon: "📈",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Giám sát liên tục",
    description: "Không bỏ lỡ sự cố nào",
    trend: "up",
    trendValue: "100%",
    icon: "👁️",
  },
  {
    value: 5,
    prefix: "<",
    suffix: " phút",
    label: "Thời gian phản hồi",
    description: "Khi có cảnh báo khẩn cấp",
    trend: "down",
    trendValue: "-80%",
    icon: "⚡",
  },
  {
    value: 98,
    suffix: "%",
    label: "Độ chính xác cảm biến",
    description: "Dữ liệu đáng tin cậy",
    trend: "up",
    trendValue: "+5%",
    icon: "🎯",
  },
];

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const controls = animate(0, value, {
            duration: 2,
            ease: "easeOut" as const,
            onUpdate: (latest) => {
              setDisplayValue(Math.round(latest));
            },
          });
          return () => controls.stop();
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

function StatisticsSection() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950" />

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">
              Thành tích nổi bật
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Con số
            <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ấn tượng
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-200/70 text-lg">
            Kết quả thực tế từ hàng trăm nông trại đang tin dùng FarmOS
          </p>
        </motion.div>

        {/* Stats Grid with 3D Effect */}
        <motion.div
          onMouseMove={handleMouse}
          onMouseLeave={() => {
            x.set(0);
            y.set(0);
          }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Card */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-green-500/30 transition-all duration-300 overflow-hidden">
                {/* Background Icon */}
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:opacity-20 transition-opacity">
                  {stat.icon}
                </div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <motion.span
                      className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent"
                      style={{ textShadow: "0 0 30px rgba(34, 197, 94, 0.3)" }}
                    >
                      <AnimatedCounter
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </motion.span>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                        stat.trend === "up"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stat.trendValue}
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-slate-400">{stat.description}</p>

                  {/* Progress Bar */}
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default StatisticsSection;
