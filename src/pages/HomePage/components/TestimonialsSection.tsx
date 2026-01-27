import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Nguyễn Văn Minh",
    role: "Chủ trang trại bò sữa",
    location: "Mộc Châu, Sơn La",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
    content:
      "Trước đây tôi phải đi kiểm tra chuồng 4-5 lần/ngày. Giờ với FarmOS, tôi theo dõi mọi thứ trên điện thoại. Đặc biệt cảnh báo NH3 giúp tôi phát hiện vấn đề thông gió kịp thời.",
    rating: 5,
    farmImage:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop",
    stats: { farms: 2, years: 3, saved: "45%" },
  },
  {
    name: "Trần Thị Hương",
    role: "Quản lý trang trại rau",
    location: "Đà Lạt, Lâm Đồng",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
    content:
      "Tính năng dự báo thời tiết và nhật ký hoạt động giúp đội ngũ của tôi làm việc hiệu quả hơn 30%. Báo cáo tự động gửi cho chủ đầu tư cũng tiết kiệm rất nhiều thời gian.",
    rating: 5,
    farmImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070&auto=format&fit=crop",
    stats: { farms: 1, years: 2, saved: "30%" },
  },
  {
    name: "Lê Hoàng Nam",
    role: "Chủ đầu tư",
    location: "TP. Hồ Chí Minh",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
    content:
      "Tôi có 3 nông trại ở các tỉnh khác nhau. FarmOS giúp tôi quản lý từ xa, theo dõi chi phí và ROI từng mùa vụ rõ ràng. Đầu tư vào FarmOS là quyết định đúng đắn nhất.",
    rating: 5,
    farmImage:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop",
    stats: { farms: 3, years: 1, saved: "35%" },
  },
];

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const nextSlide = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = testimonials[activeIndex];

  return (
    <section className="py-24 bg-gradient-to-br from-green-950 via-green-900 to-green-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/5 to-transparent" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

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
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-green-400 text-sm font-medium">
              Đánh giá 5 sao
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Khách hàng
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              tin tưởng FarmOS
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-200/70 text-lg">
            Những câu chuyện thành công từ nông trại thực tế
          </p>
        </motion.div>

        {/* Main Testimonial Card */}
        <div className="relative">
          <AnimatePresence
            mode="wait"
            custom={direction}
          >
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" as const }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              {/* Image Side */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
                  <img
                    src={currentTestimonial.farmImage}
                    alt="Farm"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Floating Stats */}
                  <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
                      <div className="text-2xl font-bold text-white">
                        {currentTestimonial.stats.farms}
                      </div>
                      <div className="text-xs text-white/70">Nông trại</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
                      <div className="text-2xl font-bold text-white">
                        {currentTestimonial.stats.years}
                      </div>
                      <div className="text-xs text-white/70">Năm sử dụng</div>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-md rounded-2xl px-4 py-3 border border-green-500/30">
                      <div className="text-2xl font-bold text-green-400">
                        {currentTestimonial.stats.saved}
                      </div>
                      <div className="text-xs text-green-300">Tiết kiệm</div>
                    </div>
                  </div>
                </div>

                {/* Avatar - overlapping card */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-6 -right-6 lg:right-auto lg:-left-6"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
                    <img
                      src={currentTestimonial.avatar}
                      alt={currentTestimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Content Side */}
              <div className="lg:pl-8">
                <Quote className="h-16 w-16 text-green-500/30 mb-6" />

                <blockquote className="text-xl lg:text-2xl text-white leading-relaxed mb-8">
                  "{currentTestimonial.content}"
                </blockquote>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: currentTestimonial.rating }).map(
                    (_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ),
                  )}
                </div>

                {/* Author Info */}
                <div className="border-t border-slate-700 pt-6">
                  <h4 className="text-xl font-bold text-white mb-1">
                    {currentTestimonial.name}
                  </h4>
                  <p className="text-green-400 font-medium">
                    {currentTestimonial.role}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {currentTestimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "w-8 bg-green-500"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
