import { Link } from 'react-router-dom'
import { Play, Users, Trophy, Coins, ArrowRight } from 'lucide-react'
import useAuthStore from '../stores/authStore'

function Home() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          <span className="text-6xl md:text-8xl">🐎</span>
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          <span className="text-primary-500">Horse Race</span> Betting
        </h2>
        <p className="text-base sm:text-xl text-dark-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Đặt cược đua ngựa online - Nhận <span className="text-yellow-400 font-bold">500 coin miễn phí</span> mỗi ngày!
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          {user ? (
            <Link 
              to="/lobby"
              className="flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-xl text-lg font-bold transition transform hover:scale-105"
            >
              <Play size={24} />
              Vào Lobby
              <ArrowRight size={20} />
            </Link>
          ) : (
            <>
              <Link 
                to="/register"
                className="flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-xl text-lg font-bold transition transform hover:scale-105"
              >
                Đăng ký ngay
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/login"
                className="flex items-center gap-2 px-8 py-4 bg-dark-700 hover:bg-dark-600 rounded-xl text-lg font-bold transition"
              >
                Đã có tài khoản?
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Coins className="text-yellow-400" size={40} />}
          title="500 Coin / Ngày"
          description="Đăng nhập hằng ngày để nhận coin miễn phí. Không cần nạp tiền thật!"
        />
        <FeatureCard 
          icon={<Users className="text-blue-400" size={40} />}
          title="Đua cùng mọi người"
          description="Tham gia các cuộc đua với người chơi khác. Số ngựa tùy thuộc số người tham gia."
        />
        <FeatureCard 
          icon={<Trophy className="text-primary-400" size={40} />}
          title="Thắng lớn"
          description="Top 3 chia nhau giải thưởng: 50% - 30% - 15% tổng tiền cược!"
        />
      </section>

      {/* How it works */}
      <section className="bg-dark-900 rounded-2xl p-4 sm:p-8">
        <h3 className="text-2xl font-bold mb-6 text-center">Cách chơi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Step number={1} title="Đăng ký" desc="Tạo tài khoản miễn phí" />
          <Step number={2} title="Nhận coin" desc="500 coin mỗi ngày đăng nhập" />
          <Step number={3} title="Đặt cược" desc="Chọn race và đặt cược ngựa" />
          <Step number={4} title="Xem đua" desc="Cổ vũ ngựa của bạn!" />
        </div>
      </section>

      {/* Prize pool */}
      <section className="text-center">
        <h3 className="text-2xl font-bold mb-6">Cơ cấu giải thưởng</h3>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <PrizeCard place="🥇" position="1st" percent="50%" color="text-yellow-400" />
          <PrizeCard place="🥈" position="2nd" percent="30%" color="text-gray-300" />
          <PrizeCard place="🥉" position="3rd" percent="15%" color="text-orange-400" />
        </div>
        <p className="text-dark-400 mt-4">5% phí hệ thống</p>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-dark-900 rounded-xl p-6 text-center hover:bg-dark-800 transition">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-dark-300">{description}</p>
    </div>
  )
}

function Step({ number, title, desc }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">
        {number}
      </div>
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-dark-400 text-sm">{desc}</p>
    </div>
  )
}

function PrizeCard({ place, position, percent, color }) {
  return (
    <div className="bg-dark-900 rounded-xl p-4 sm:p-6 min-w-[110px] sm:min-w-[150px]">
      <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{place}</div>
      <div className="text-dark-400 text-xs sm:text-sm">{position}</div>
      <div className={`text-xl sm:text-2xl font-bold ${color}`}>{percent}</div>
    </div>
  )
}

export default Home
