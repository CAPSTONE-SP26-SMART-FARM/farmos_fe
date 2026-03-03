import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowRight,
	Play,
	Leaf,
	Activity,
	Droplets,
	Sun,
	Thermometer,
	Wind,
	Zap,
} from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

const floatVariants = {
	animate: {
		y: [-8, 8, -8],
		transition: {
			duration: 5,
			repeat: Infinity,
			ease: "easeInOut" as const,
		},
	},
};

const scaleVariants = {
	animate: {
		scale: [1, 1.05, 1],
		transition: {
			duration: 4,
			repeat: Infinity,
			ease: "easeInOut" as const,
		},
	},
};

const bentoCards = [
	{
		icon: Droplets,
		label: "Độ ẩm đất",
		value: "68%",
		trend: "+5%",
		color: "from-blue-500 to-cyan-400",
		bgColor: "bg-blue-500/10",
	},
	{
		icon: Thermometer,
		label: "Nhiệt độ",
		value: "28°C",
		trend: "Ổn định",
		color: "from-orange-500 to-amber-400",
		bgColor: "bg-orange-500/10",
	},
	{
		icon: Sun,
		label: "Ánh sáng",
		value: "850 lux",
		trend: "Tốt",
		color: "from-yellow-500 to-orange-400",
		bgColor: "bg-yellow-500/10",
	},
	{
		icon: Wind,
		label: "Gió",
		value: "12 km/h",
		trend: "Nhẹ",
		color: "from-teal-500 to-emerald-400",
		bgColor: "bg-teal-500/10",
	},
];

function HeroSection() {
	return (
		<section className="relative min-h-screen flex items-center overflow-hidden">
			{/* Background Image with Overlay */}
			<div className="absolute inset-0">
				<img
					src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"
					alt="Sunrise over farm field"
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-br from-green-950/95 via-green-900/90 to-emerald-950/95" />
			</div>

			{/* Animated particles/shapes */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<motion.div
					animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
					transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
					className="absolute top-20 right-1/4 w-3 h-3 bg-green-400/60 rounded-full blur-sm"
				/>
				<motion.div
					animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
					transition={{
						duration: 6,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1,
					}}
					className="absolute top-1/3 left-1/4 w-2 h-2 bg-emerald-300/50 rounded-full blur-sm"
				/>
				<motion.div
					animate={{ y: [-15, 15, -15] }}
					transition={{
						duration: 7,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 2,
					}}
					className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-amber-400/40 rounded-full blur-sm"
				/>

				{/* Decorative lines */}
				<svg
					className="absolute top-0 left-0 w-full h-full opacity-10"
					preserveAspectRatio="none"
				>
					<motion.line
						x1="0%"
						y1="100%"
						x2="50%"
						y2="0%"
						stroke="url(#lineGradient)"
						strokeWidth="1"
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: 2, ease: "easeInOut" }}
					/>
					<defs>
						<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
							<stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
							<stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
						</linearGradient>
					</defs>
				</svg>
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					{/* Left content */}
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						<motion.div variants={itemVariants}>
							<Badge
								variant="secondary"
								className="mb-6 px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-default backdrop-blur-sm border border-green-500/30"
							>
								<Leaf className="w-4 h-4 mr-2" />
								Smart Farming Revolution
							</Badge>
						</motion.div>

						<motion.h1
							variants={itemVariants}
							className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6"
						>
							<span className="text-white">Nông trại </span>
							<span className="relative">
								<span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent">
									Thông minh
								</span>
								<svg
									className="absolute -bottom-2 left-0 w-full"
									viewBox="0 0 200 12"
									fill="none"
								>
									<path
										d="M2 8C50 2 150 2 198 8"
										stroke="url(#gradient)"
										strokeWidth="4"
										strokeLinecap="round"
									/>
									<defs>
										<linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
											<stop offset="0%" stopColor="#4ade80" />
											<stop offset="100%" stopColor="#22c55e" />
										</linearGradient>
									</defs>
								</svg>
							</span>
							<br />
							<span className="text-white/90">trong tầm tay</span>
						</motion.h1>

						<motion.p
							variants={itemVariants}
							className="text-lg sm:text-xl text-green-100/80 mb-8 max-w-xl leading-relaxed"
						>
							FarmOS kết hợp{" "}
							<span className="text-green-300 font-medium">IoT</span>,{" "}
							<span className="text-green-300 font-medium">AI</span> và{" "}
							<span className="text-green-300 font-medium">chuyên gia</span>{" "}
							giúp bạn giám sát, quản lý và tối ưu hóa nông trại mọi lúc, mọi
							nơi.
						</motion.p>

						<motion.div
							variants={itemVariants}
							className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12"
						>
							<Button
								asChild
								size="lg"
								className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-full cursor-pointer transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
							>
								<Link to="/register">
									Bắt đầu miễn phí
									<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>

							<Button
								variant="ghost"
								size="lg"
								className="text-green-200 hover:text-white hover:bg-white/10 px-6 py-6 text-lg rounded-full cursor-pointer transition-all duration-300"
							>
								<div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-3">
									<Play className="h-4 w-4 fill-current" />
								</div>
								Xem Demo
							</Button>
						</motion.div>

						{/* Trust badges */}
						<motion.div
							variants={itemVariants}
							className="flex flex-wrap items-center gap-6 pt-8 border-t border-white/10"
						>
							{[
								{ value: "500+", label: "Nông trại" },
								{ value: "98%", label: "Hài lòng" },
								{ value: "24/7", label: "Giám sát" },
							].map((stat, index) => (
								<div key={index} className="flex items-center gap-2">
									<span className="text-2xl font-bold text-white">
										{stat.value}
									</span>
									<span className="text-sm text-green-300/70">
										{stat.label}
									</span>
								</div>
							))}
						</motion.div>
					</motion.div>

					{/* Right visual - Bento Grid Dashboard */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.3 }}
						className="relative hidden lg:block"
					>
						{/* Bento Grid Layout */}
						<div className="grid grid-cols-2 gap-4 max-w-md">
							{/* Main Image Card - spans 2 cols */}
							<motion.div
								variants={scaleVariants}
								animate="animate"
								className="col-span-2 relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
							>
								<img
									src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1991&auto=format&fit=crop"
									alt="Smart greenhouse with technology"
									className="w-full h-48 object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
								<div className="absolute bottom-4 left-4 right-4">
									<div className="flex items-center gap-2 mb-2">
										<span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
										<span className="text-xs text-green-300">
											Đang giám sát
										</span>
									</div>
									<p className="text-white font-semibold">Nông trại Đà Lạt</p>
									<p className="text-white/70 text-sm">
										12 khu vực · 48 cảm biến
									</p>
								</div>
							</motion.div>

							{/* Sensor Cards */}
							{bentoCards.map((card, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
									whileHover={{ scale: 1.02, y: -2 }}
									className={`${card.bgColor} backdrop-blur-xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all duration-300`}
								>
									<div
										className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}
									>
										<card.icon className="w-5 h-5 text-white" />
									</div>
									<p className="text-green-200/70 text-xs mb-1">{card.label}</p>
									<p className="text-white text-xl font-bold">{card.value}</p>
									<p className="text-green-400 text-xs mt-1">{card.trend}</p>
								</motion.div>
							))}

							{/* Activity Card - spans 2 cols */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.9 }}
								className="col-span-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 border border-green-500/30"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
											<Activity className="w-6 h-6 text-white" />
										</div>
										<div>
											<p className="text-white font-semibold">
												Hiệu suất hôm nay
											</p>
											<p className="text-green-300/70 text-sm">
												Tăng 12% so với hôm qua
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-3xl font-bold text-white">94%</p>
										<p className="text-green-400 text-xs flex items-center gap-1">
											<Zap className="w-3 h-3" /> Xuất sắc
										</p>
									</div>
								</div>
							</motion.div>
						</div>

						{/* Floating Alert */}
						<motion.div
							variants={floatVariants}
							animate="animate"
							className="absolute -left-12 top-1/3 bg-white rounded-2xl p-3 shadow-xl border border-green-100 max-w-[180px]"
						>
							<div className="flex items-start gap-2">
								<div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
									<Leaf className="w-4 h-4 text-amber-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500">Cảnh báo</p>
									<p className="text-sm font-medium text-gray-900 leading-tight">
										Khu B cần tưới nước
									</p>
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>

			{/* Bottom gradient fade */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-50 to-transparent" />
		</section>
	);
}

export default HeroSection;
