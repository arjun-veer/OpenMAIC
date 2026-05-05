'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  GraduationCap,
  Users,
  Zap,
  Download,
  Star,
  ArrowRight,
  CheckCircle,
  Brain,
  MessageSquare,
  FileText,
  Play,
  Globe,
  Cpu,
  Gamepad2,
  Network,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const features = [
  {
    icon: Zap,
    title: 'One-Click Lesson Generation',
    desc: 'Describe any topic or upload your materials — the AI builds a full, structured lesson in minutes.',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: Users,
    title: 'Multi-Agent Classroom',
    desc: 'AI teachers and peers lecture, discuss, and interact with you in real time — like a live classroom.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Brain,
    title: 'Adaptive Learning',
    desc: 'The system adapts to your learning pace, knowledge level, and preferred style automatically.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: FileText,
    title: 'Rich Scene Types',
    desc: 'Slides, quizzes, interactive HTML simulations, whiteboards, and project-based learning scenes.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: MessageSquare,
    title: 'Voice & Text Interaction',
    desc: 'Agents draw diagrams, write formulas on a whiteboard, and explain concepts aloud with TTS.',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    desc: 'Download editable PowerPoint slides, interactive HTML pages, or full classroom ZIP bundles.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
];

const showcaseItems = [
  {
    label: 'Presentation Slides',
    tag: 'Slides',
    img: '/slides.gif',
    desc: 'Beautiful, auto-generated lesson slides with rich content, diagrams, and explanations.',
  },
  {
    label: 'Interactive Quizzes',
    tag: 'Quizzes',
    img: '/quiz.gif',
    desc: 'Embedded assessments that test understanding and provide instant AI-powered feedback.',
  },
  {
    label: 'Live Simulations',
    tag: 'Interactive',
    img: '/interactive.gif',
    desc: '3D models, physics sims, mind maps, and coding environments — all inside your lesson.',
  },
  {
    label: 'Project-Based Learning',
    tag: 'PBL',
    img: '/pbl.gif',
    desc: 'Hands-on projects guided by AI mentors that reinforce concepts through doing.',
  },
];

const interactiveTypes = [
  {
    emoji: '🌐',
    icon: Globe,
    title: '3D Visualization',
    desc: 'Three-dimensional visual representations that make abstract structures more intuitive and explorable.',
    img: '/3D_interactive.gif',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    tag: 'bg-blue-500',
  },
  {
    emoji: '⚙️',
    icon: Cpu,
    title: 'Simulation',
    desc: 'Process simulations and experimental environments for observing dynamic changes and outcomes in real time.',
    img: '/simulation_interactive.gif',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800/50',
    tag: 'bg-orange-500',
  },
  {
    emoji: '🎮',
    icon: Gamepad2,
    title: 'Game',
    desc: 'Knowledge-based mini-games that reinforce understanding and memory through interactive challenges.',
    img: '/game_interactive.gif',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/50',
    tag: 'bg-purple-500',
  },
  {
    emoji: '🧭',
    icon: Network,
    title: 'Mind Map',
    desc: 'Structured knowledge organization to help learners build an overall conceptual framework visually.',
    img: '/mindmap_interactive.gif',
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/50',
    tag: 'bg-green-500',
  },
  {
    emoji: '💻',
    icon: Code2,
    title: 'Online Programming',
    desc: 'In-browser coding and instant execution for learning by writing, testing, and iterating code live.',
    img: '/code_interactive.gif',
    color: 'from-gray-700 to-gray-900',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700/50',
    tag: 'bg-gray-700',
  },
];

const reviews = [
  {
    name: 'Priya Sharma',
    role: 'Class 12 Student, Delhi',
    avatar: '/avatars/student1.svg',
    rating: 5,
    text: 'AI-Guru explained integration for my boards exam in a way no teacher ever could. The whiteboard animations made it crystal clear!',
  },
  {
    name: 'Arjun Mehta',
    role: 'Engineering Student, Mumbai',
    avatar: '/avatars/student2.svg',
    rating: 5,
    text: 'I uploaded my thermodynamics notes and got a full interactive classroom with simulations. Scored 92% in my semester!',
  },
  {
    name: 'Kavya Reddy',
    role: 'UPSC Aspirant, Hyderabad',
    avatar: '/avatars/student3.svg',
    rating: 5,
    text: 'The multi-agent discussion feature helped me understand polity topics from multiple perspectives. Game changer for competitive exams.',
  },
  {
    name: 'Rohan Gupta',
    role: 'JEE Aspirant, Pune',
    avatar: '/avatars/learner.svg',
    rating: 5,
    text: 'Generated entire chapters of physics with one click. The quiz section helped me identify weak areas instantly.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Describe Your Topic',
    desc: 'Type what you want to learn — a concept, a chapter, or paste your study material. Upload PDFs too.',
    icon: BookOpen,
  },
  {
    step: '02',
    title: 'AI Builds Your Classroom',
    desc: 'Within minutes, AI agents craft slides, quizzes, simulations, and an interactive lesson plan.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Learn & Interact',
    desc: 'Enter your personalized classroom, interact with AI agents, take quizzes, and export your materials.',
    icon: GraduationCap,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function LogoWithText({ imgClass = 'h-9', textClass = 'text-lg' }: { imgClass?: string; textClass?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="AI-Guru icon" className={imgClass} />
      <span className={`font-extrabold tracking-tight text-gray-900 dark:text-white ${textClass}`}>
        AI<span className="text-orange-500">-Guru</span>
      </span>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [activeInteractive, setActiveInteractive] = useState(0);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <LogoWithText imgClass="h-9" textClass="text-xl" />
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#showcase" className="hover:text-orange-500 transition-colors">Showcase</a>
            <a href="#interactive" className="hover:text-orange-500 transition-colors">Interactive</a>
            <a href="#how-it-works" className="hover:text-orange-500 transition-colors">How It Works</a>
            <a href="#reviews" className="hover:text-orange-500 transition-colors">Reviews</a>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 py-2 text-sm font-semibold shadow-sm"
          >
            Get Started <ArrowRight className="w-4 h-4 ml-1 inline" />
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-[-20%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[-20%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Specially built for Indian students — learn smarter, not harder
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <LogoWithText imgClass="h-20 md:h-28" textClass="text-5xl md:text-7xl" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight"
          >
            Your Personal{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              AI Tutor
            </span>
            <br />
            Available 24/7
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Turn any topic into an immersive, multi-agent classroom experience in seconds.
            Interactive lessons, quizzes, simulations — all powered by AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all font-semibold"
            >
              Start Learning Free <ArrowRight className="w-5 h-5 ml-2 inline" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-6 text-base rounded-xl border-gray-200 dark:border-gray-700 font-semibold"
            >
              <Play className="w-5 h-5 mr-2 inline" /> See It in Action
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none rounded-2xl" />
            <img
              src="/banner.png"
              alt="AI-Guru classroom interface"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400 dark:text-gray-600"
          >
            {['Free to use', 'No sign-up required', 'Supports 10+ AI models', 'Export to PPTX & HTML'].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                <span>{badge}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" /> Everything you need to learn
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              A complete learning platform
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              AI-Guru combines the best of classroom teaching, interactive tools, and AI assistance into one seamless experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-white dark:bg-gray-800 p-7 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 ${feat.bg} ${feat.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase ── */}
      <section id="showcase" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Play className="w-3.5 h-3.5" /> See it in action
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Every type of learning, covered
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              From slides to simulations, AI-Guru creates the right format for every concept.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="flex flex-col gap-4">
              {showcaseItems.map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveShowcase(i)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                    activeShowcase === i
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeShowcase === i
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.tag}
                    </span>
                    <h3 className={`font-bold ${activeShowcase === i ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.label}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.button>
              ))}
            </div>

            <motion.div
              key={activeShowcase}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl"
            >
              <img
                src={showcaseItems[activeShowcase].img}
                alt={showcaseItems[activeShowcase].label}
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Five Types of Interactive UI ── */}
      <section id="interactive" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" /> Deep Interactive Mode
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Five Types of Interactive UI
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Don&apos;t just watch knowledge — explore it. AI-Guru&apos;s Deep Interactive Mode creates hands-on learning experiences
              where you adjust experiments, observe simulations, and actively discover concepts.
            </p>
          </motion.div>

          {/* Interactive type selector tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {interactiveTypes.map((type, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setActiveInteractive(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  activeInteractive === i
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
              >
                <span>{type.emoji}</span>
                <span>{type.title}</span>
              </motion.button>
            ))}
          </div>

          {/* Active interactive type display */}
          {(() => {
            const ActiveIcon = interactiveTypes[activeInteractive].icon;
            return (
          <motion.div
            key={activeInteractive}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-2 gap-10 items-center"
          >
            <div className={`rounded-2xl overflow-hidden border shadow-2xl ${interactiveTypes[activeInteractive].border}`}>
              <img
                src={interactiveTypes[activeInteractive].img}
                alt={interactiveTypes[activeInteractive].title}
                className="w-full h-auto object-cover"
              />
            </div>
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold mb-5 ${interactiveTypes[activeInteractive].tag}`}>
                <ActiveIcon className="w-4 h-4" />
                {interactiveTypes[activeInteractive].title}
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                {interactiveTypes[activeInteractive].title}
              </h3>
              <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                {interactiveTypes[activeInteractive].desc}
              </p>
              <div className={`p-5 rounded-2xl border ${interactiveTypes[activeInteractive].bg} ${interactiveTypes[activeInteractive].border}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  ✦ All interactive UI is fully responsive — works on desktop, tablet, and mobile.
                  Generated dynamically by AI based on your specific learning topic.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                {interactiveTypes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveInteractive(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeInteractive ? 'w-8 bg-orange-500' : 'w-4 bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
            );
          })()}

          {/* All 5 cards preview grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {interactiveTypes.map((type, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => {
                  setActiveInteractive(i);
                  document.getElementById('interactive')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  activeInteractive === i
                    ? `${type.border} shadow-md`
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={type.img}
                    alt={type.title}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      <span>{type.emoji}</span> {type.title}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <GraduationCap className="w-3.5 h-3.5" /> Simple to start
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              From topic to classroom in 3 steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%_-_2rem)] w-full h-px bg-gradient-to-r from-orange-200 to-transparent dark:from-orange-900 z-0" />
                )}
                <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm text-center">
                  <div className="text-5xl font-black text-orange-100 dark:text-orange-900/50 mb-4 leading-none">{step.step}</div>
                  <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5 fill-orange-400" /> Student reviews
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Loved by learners across India
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Join thousands of students who are already learning smarter with AI-Guru.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                <StarRating rating={review.rating} />
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 p-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{review.name}</div>
                    <div className="text-xs text-gray-400">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1)_0%,_transparent_60%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Start learning with AI-Guru today
          </h2>
          <p className="text-orange-100 text-lg mb-10">
            No sign-up needed. Just describe what you want to learn and let the AI do the rest.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/dashboard')}
            className="bg-white hover:bg-orange-50 text-orange-600 font-bold px-10 py-6 text-base rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            Go to Dashboard <ArrowRight className="w-5 h-5 ml-2 inline" />
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="AI-Guru" className="h-8 brightness-0 invert opacity-80" />
              <span className="font-extrabold text-white tracking-tight text-lg">
                AI<span className="text-orange-400">-Guru</span>
              </span>
              <span className="text-gray-500 text-sm hidden md:inline">— The AI-powered learning platform for every student</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
              <a href="#showcase" className="hover:text-gray-300 transition-colors">Showcase</a>
              <a href="#interactive" className="hover:text-gray-300 transition-colors">Interactive</a>
              <a href="#reviews" className="hover:text-gray-300 transition-colors">Reviews</a>
              <a href="/dashboard" className="hover:text-orange-400 transition-colors font-medium">Get Started</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} AI-Guru. Built with ❤️ for students everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}
