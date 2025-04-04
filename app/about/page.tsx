'use client';
import { Leaf, Recycle, Users, Cpu, Database, Code, Github, Linkedin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  const features = [
    {
      icon: <Cpu className="h-8 w-8" />,
      title: "AI-Assisted Verification",
      description: "Gemini AI validates waste reports for accuracy before approval"
    },
    {
      icon: <Recycle className="h-8 w-8" />,
      title: "Real-Time Management",
      description: "Track waste collection tasks with geolocation precision"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Engagement",
      description: "Interactive leaderboard fosters friendly competition"
    },
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Crypto Rewards",
      description: "Earn ETH tokens for your eco-friendly contributions"
    }
  ];

  const techStack = [
    { name: "Next.js 14", category: "Framework", icon: <Code className="h-5 w-5 text-emerald-600" /> },
    { name: "React.js", category: "Library", icon: <Code className="h-5 w-5 text-blue-500" /> },
    { name: "TypeScript", category: "Language", icon: <Code className="h-5 w-5 text-blue-600" /> },
    { name: "TailwindCSS", category: "Styling", icon: <Code className="h-5 w-5 text-cyan-500" /> },
    { name: "Drizzle ORM", category: "Database", icon: <Database className="h-5 w-5 text-orange-500" /> },
    { name: "Neon Serverless", category: "Postgres", icon: <Database className="h-5 w-5 text-green-500" /> },
    { name: "Shadcn/ui", category: "Components", icon: <Code className="h-5 w-5 text-zinc-700" /> },
    { name: "OpenMap API", category: "Service", icon: <Code className="h-5 w-5 text-red-500" /> },
    { name: "Gemini AI", category: "AI", icon: <Cpu className="h-5 w-5 text-purple-500" /> },
    { name: "Tabler Icons", category: "Assets", icon: <Code className="h-5 w-5 text-gray-500" /> }
  ];

  const team = [
    {
      name: "Arya Dasgupta",
      role: "Backend Developer",
      linkedin: "https://www.linkedin.com/in/aryadasgupta2004/"
    },
    {
      name: "Ankit Saha",
      role: "Lead Developer",
      linkedin: "https://www.linkedin.com/in/ankit-saha09/"
    },
    {
      name: "Ashmita Chatterjee",
      role: "UI/UX Designer",
      linkedin: "https://www.linkedin.com/in/ashmita-chatterjee-62272628b/"
    },
    {
      name: "Arunima Layek",
      role: "Presentation & Design",
      linkedin: "https://www.linkedin.com/in/arunima-layek-619755355/"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f0fdf9]">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6 border border-emerald-200 shadow-sm"
          >
            <Award className="mr-2 h-4 w-4" />
            Hacktropica 2K25 • Asansol
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Transforming Waste into <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">Wealth</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            A blockchain-powered platform developed for Hacktropica 2K25 that rewards sustainable waste management with cryptocurrency.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
              <Link href="/report">
                Report Waste Now
              </Link>
            </Button>
            <Button variant="outline" asChild className="px-8 py-6 text-lg border-2">
              <Link href="/leaderboard">
                View Leaderboard
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How <span className="text-emerald-600">CleanRewards</span> Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our innovative platform combines cutting-edge technology with environmental consciousness
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 border border-gray-100 hover:shadow-lg transition-all hover:border-emerald-200 group"
              >
                <div className="flex items-center justify-center h-12 w-12 bg-emerald-50 rounded-xl text-emerald-600 mb-6 group-hover:bg-emerald-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our <span className="text-emerald-600">Technology</span> Stack</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built with modern tools to deliver exceptional performance and user experience
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors hover:shadow-md text-center"
              >
                <div className="flex justify-center mb-3">
                  {tech.icon}
                </div>
                <div className="text-xs font-medium text-gray-400 mb-1">{tech.category}</div>
                <div className="font-medium text-gray-800">{tech.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The <span className="text-emerald-600">Team</span></h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Passionate developers creating solutions for a sustainable future
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all text-center group"
              >
                <div className="h-20 w-20 mx-auto bg-emerald-50 rounded-full mb-4 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-500 mb-4">{member.role}</p>
                <Button variant="outline" size="sm" asChild className="border-emerald-200 hover:border-emerald-300">
                  <Link href={member.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2 text-emerald-600" />
                    <span className="text-emerald-700">Connect</span>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-3 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-8 border border-emerald-200"
          >
            Hacktropica 2K25 Project
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            Ready to <span className="text-emerald-600">Earn Rewards</span> While Saving the Planet?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Join our community and start converting your eco-friendly actions into cryptocurrency today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 shadow-lg">
              <Link href="/report">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" asChild className="px-8 py-6 text-lg border-2 border-emerald-200 hover:border-emerald-300">
              <Link href="/leaderboard">
                <span className="text-emerald-700">See Community</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}