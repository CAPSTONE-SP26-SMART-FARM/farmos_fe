import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Droplets,
  ThermometerSun,
  Wind,
  TrendingUp,
  TrendingDown,
  Bell,
  Wifi,
  Battery,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const sensorData = [
  {
    icon: ThermometerSun,
    label: "Nhiệt độ",
    value: 28.5,
    unit: "°C",
    status: "normal",
    trend: "+0.3",
    min: 20,
    max: 35,
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Droplets,
    label: "Độ ẩm đất",
    value: 65,
    unit: "%",
    status: "normal",
    trend: "-2.1",
    min: 0,
    max: 100,
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Wind,
    label: "NH3",
    value: 12,
    unit: "ppm",
    status: "warning",
    trend: "+3.5",
    min: 0,
    max: 25,
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Activity,
    label: "CO2",
    value: 420,
    unit: "ppm",
    status: "normal",
    trend: "+10",
    min: 0,
    max: 1000,
    color: "from-green-500 to-emerald-500",
  },
];

const chartData = [28, 27, 26, 27, 28, 29, 30, 31, 30, 29, 28, 27];

function AnimatedValue({ value, unit }: { value: number; unit: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        const change = (Math.random() - 0.5) * 0.5;
        return Number((prev + change).toFixed(1));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {displayValue}
      <span className="text-sm font-normal text-green-300 ml-1">{unit}</span>
    </>
  );
}

function DashboardPreviewSection() {
  const [activeChart, setActiveChart] = useState<"1H" | "24H" | "7D">("24H");

  return (
    <section className="py-24 bg-linear-to-b from-green-50 to-green-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700 text-sm font-medium">
              Dashboard Real-time
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-900 mb-6">
            Giao diện
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              trực quan & hiện đại
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-800 text-lg">
            Theo dõi mọi chỉ số quan trọng trong thời gian thực với thiết kế
            thân thiện
          </p>
        </motion.div>

        {/* Mock Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-[40px] blur-2xl" />

          <div className="relative bg-green-900 rounded-3xl shadow-2xl overflow-hidden border border-green-700">
            {/* Browser Header */}
            <div className="bg-green-800 px-6 py-4 flex items-center justify-between border-b border-green-700">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div className="flex-1 max-w-md mx-8">
                <div className="bg-green-700 rounded-lg px-4 py-2 text-sm text-green-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span>app.farmos.vn/dashboard</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-green-300 hover:text-white cursor-pointer" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 lg:p-8">
              {/* Top Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Nông trại Mộc Châu
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-green-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Sơn La, Việt Nam
                    </span>
                    <span className="flex items-center gap-1">
                      <Battery className="w-4 h-4 text-green-400" />
                      98%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-4 h-4 text-green-400" />
                      Online
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    12 cảm biến hoạt động
                  </Badge>
                </div>
              </div>

              {/* Sensor Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {sensorData.map((sensor, index) => {
                  const Icon = sensor.icon;
                  const percentage =
                    ((sensor.value - sensor.min) / (sensor.max - sensor.min)) *
                    100;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-green-800/50 backdrop-blur-sm rounded-2xl p-5 border border-green-700 hover:border-green-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sensor.color} flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <Badge
                          variant={
                            sensor.status === "warning"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            sensor.status === "warning"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }
                        >
                          {sensor.status === "warning" ? "⚠️" : "✓"}
                        </Badge>
                      </div>

                      <div className="text-3xl font-bold text-white mb-1">
                        <AnimatedValue
                          value={sensor.value}
                          unit={sensor.unit}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-300">
                          {sensor.label}
                        </span>
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            sensor.trend.startsWith("+")
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {sensor.trend.startsWith("+") ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {sensor.trend}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1.5 bg-green-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full bg-gradient-to-r ${sensor.color} rounded-full`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Chart Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-green-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-white text-lg">
                      Biểu đồ nhiệt độ
                    </h4>
                    <p className="text-green-300 text-sm">
                      Theo dõi nhiệt độ chuồng trại
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(["1H", "24H", "7D"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setActiveChart(period)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeChart === period
                            ? "bg-green-500 text-white"
                            : "bg-green-700 text-green-300 hover:bg-green-600"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div className="h-48 flex items-end gap-2">
                  {chartData.map((value, i) => {
                    const height = ((value - 24) / 10) * 100;
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg cursor-pointer relative group"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {value}°C
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-slate-500">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>24:00</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default DashboardPreviewSection;
