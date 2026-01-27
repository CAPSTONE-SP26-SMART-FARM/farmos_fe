import {
  AlertTriangle,
  Clock,
  Eye,
  TrendingDown,
  ArrowRight,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const problems = [
  {
    icon: Eye,
    title: "Khó giám sát từ xa",
    problem: "Phụ thuộc hoàn toàn vào báo cáo thủ công",
    solution: "Dashboard thời gian thực 24/7",
    image:
      "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=1972&auto=format&fit=crop",
    stat: "85%",
    statLabel: "chủ trại lo lắng",
    color: "from-rose-500 to-pink-600",
    solutionColor: "from-emerald-500 to-green-600",
  },
  {
    icon: AlertTriangle,
    title: "Thiếu chuyên môn",
    problem: "Không có chuyên gia hỗ trợ kịp thời",
    solution: "Kết nối bác sĩ thú y & chuyên gia",
    image:
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop",
    stat: "60%",
    statLabel: "thiệt hại có thể tránh",
    color: "from-orange-500 to-amber-600",
    solutionColor: "from-teal-500 to-cyan-600",
  },
  {
    icon: TrendingDown,
    title: "Thiếu minh bạch",
    problem: "Khó kiểm soát chi phí và doanh thu",
    solution: "Báo cáo tài chính tự động",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    stat: "40%",
    statLabel: "thất thoát không rõ nguồn",
    color: "from-red-500 to-rose-600",
    solutionColor: "from-blue-500 to-indigo-600",
  },
  {
    icon: Clock,
    title: "Phản ứng chậm",
    problem: "Phát hiện và xử lý sự cố quá lâu",
    solution: "Cảnh báo AI tức thì",
    image:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop",
    stat: "72h",
    statLabel: "thời gian phản ứng TB",
    color: "from-violet-500 to-purple-600",
    solutionColor: "from-green-500 to-emerald-600",
  },
];

function ProblemSection() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-green-950 via-green-900 to-green-950 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600/10 border border-amber-600/20 text-amber-500 text-sm font-medium rounded-full mb-6 backdrop-blur-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Thách thức cần vượt qua
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Từ </span>
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Vấn đề
            </span>
            <span className="text-white"> đến </span>
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Giải pháp
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-green-200/70 text-lg">
            Hover vào từng thẻ để khám phá cách FarmOS giải quyết vấn đề
          </p>
        </motion.div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeCard === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                className="group relative h-[320px] cursor-pointer perspective-1000"
              >
                {/* Card Container with 3D flip effect */}
                <div
                  className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
                    isActive ? "rotate-y-180" : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isActive ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front - Problem Side */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />

                    {/* Problem Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      {/* Top Row */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          <p className="text-3xl font-bold text-white">
                            {item.stat}
                          </p>
                          <p className="text-xs text-white/70">
                            {item.statLabel}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Content */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <X className="w-5 h-5 text-rose-400" />
                          <span className="text-rose-400 text-sm font-medium uppercase tracking-wider">
                            Vấn đề
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-white/70">{item.problem}</p>

                        <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
                          <span>Hover để xem giải pháp</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back - Solution Side */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div
                      className={`w-full h-full bg-gradient-to-br ${item.solutionColor}`}
                    />

                    {/* Solution Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      {/* Top Row */}
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">
                          <div className="flex items-center gap-1">
                            <Check className="w-5 h-5 text-white" />
                            <span className="text-white font-medium">
                              Đã giải quyết
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Content */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-5 h-5 text-white" />
                          <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                            Giải pháp FarmOS
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {item.solution}
                        </h3>
                        <p className="text-white/80">
                          Thay vì "{item.problem.toLowerCase()}", giờ đây bạn có
                          thể{" "}
                          <span className="font-semibold">
                            {item.solution.toLowerCase()}
                          </span>{" "}
                          với FarmOS.
                        </p>

                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isActive ? "100%" : 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="mt-4 h-1 bg-white/30 rounded-full overflow-hidden"
                        >
                          <div className="h-full bg-white rounded-full" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-sm border border-emerald-500/20 px-8 py-6 rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">
                  4 vấn đề — 1 giải pháp
                </p>
                <p className="text-emerald-400 text-sm">
                  FarmOS - Nền tảng quản lý nông trại toàn diện
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-400 hidden sm:block" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              Bắt đầu ngay
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProblemSection;
