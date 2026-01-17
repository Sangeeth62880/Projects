'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, BarChart3, Sparkles, Brain, Heart, Puzzle, Rocket } from 'lucide-react';
import { Mascot } from '@/components/Mascot';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand Logo */}
          <motion.div
            className="inline-flex items-center gap-3 mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Brain className="w-12 h-12 text-purple-600" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Numo
            </h1>
          </motion.div>

          {/* Hero Headline */}
          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Unlock the Magic of Numbers! ✨
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="mb-12"
          >
            <Mascot mood="happy" size="lg" message="Hi! Ready for an adventure? 🚀" />
          </motion.div>
        </motion.div>

        {/* Main Actions */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Child Choice: Adventure Mode */}
          <Link href="/test/age-select">
            <motion.div
              className="card cursor-pointer group hover:shadow-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Adventure Mode</h2>
                  <p className="text-gray-500 font-medium">For Kids (5-10)</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Play exciting puzzle games, solve riddles, and earn stars!
                A fun way to explore numbers. 🌟
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-medium group-hover:gap-3 transition-all">
                <span>Start the Adventure</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>

          {/* Parent Choice: Insights */}
          <Link href="/parent-dashboard">
            <motion.div
              className="card cursor-pointer group hover:shadow-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Parent Insights</h2>
                  <p className="text-gray-500 font-medium">Progress & Discoveries</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                View detailed insights into your child's cognitive strengths and
                get personalized play recommendations. 📊
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-medium group-hover:gap-3 transition-all">
                <span>View Dashboard</span>
                <BarChart3 className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Features / Philosophy */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: <Puzzle className="w-8 h-8 text-orange-500" />, label: 'Smart Puzzles', desc: 'Adapts to your child' },
            { icon: <Brain className="w-8 h-8 text-purple-500" />, label: 'Cognitive Growth', desc: 'Understanding thinking' },
            { icon: <Heart className="w-8 h-8 text-pink-500" />, label: 'Stress-Free', desc: 'No timer pressure' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
            >
              <div className="text-4xl mb-2 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{feature.label}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.footer
          className="text-center mt-12 text-gray-500 text-sm flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Heart className="w-4 h-4 text-pink-500" />
          <span>Built with curiosity for every unique mind</span>
        </motion.footer>
      </div>
    </main>
  );
}
