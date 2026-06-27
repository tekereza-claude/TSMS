"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline"

export default function About() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      description: "Visionary leader with 15+ years in education technology",
      image: "/team/sarah.jpg"
    },
    {
      name: "Michael Chen",
      role: "CTO",
      description: "Tech expert specializing in scalable education platforms",
      image: "/team/michael.jpg"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      description: "User experience advocate and education specialist",
      image: "/team/emily.jpg"
    },
    {
      name: "David Kim",
      role: "Head of Operations",
      description: "Ensuring smooth operations for all partner schools",
      image: "/team/david.jpg"
    }
  ]

  const values = [
    {
      icon: ShieldCheckIcon,
      title: "Security First",
      description: "Bank-level encryption and data protection for all users"
    },
    {
      icon: UserGroupIcon,
      title: "User-Centric",
      description: "Designed with input from educators, parents, and students"
    },
    {
      icon: ChartBarIcon,
      title: "Data-Driven",
      description: "Analytics and insights to improve educational outcomes"
    },
    {
      icon: SparklesIcon,
      title: "Innovation",
      description: "Cutting-edge technology meeting traditional education"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TSMS</h1>
                  <p className="text-xs text-gray-500">Teleparenting School Management</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Home</Link>
                <Link href="/about" className="text-blue-600 text-sm font-medium">About Us</Link>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Contact Us</Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  Get Started
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center">
              <h1 className={`text-5xl lg:text-7xl font-bold text-gray-900 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                About
                <span className="block text-blue-600">
                  TSMS Platform
                </span>
              </h1>
              
              <p className={`mx-auto mt-6 max-w-3xl text-lg lg:text-xl text-gray-600 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                We're on a mission to transform education through technology, connecting schools, teachers, 
                and parents in ways that were never before possible.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                  Our
                  <span className="block text-blue-600">
                    Mission
                  </span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  TSMS exists to revolutionize how schools operate and how parents engage with their children's education. 
                  We believe that transparency, real-time communication, and data-driven insights are the keys to 
                  improving educational outcomes for every student.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  By providing a unified platform that serves all stakeholders - from administrators to parents - 
                  we're creating an ecosystem where every student can thrive with the support they need.
                </p>
              </div>

              <div className="relative">
                <div className="relative border border-gray-200 bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Impact</h3>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">500+</p>
                      <p className="text-gray-600">Schools Partnered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">50,000+</p>
                      <p className="text-gray-600">Students Supported</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">98%</p>
                      <p className="text-gray-600">Parent Satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Our
                <span className="block text-blue-600">
                  Core Values
                </span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-lg hover:border-blue-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="relative p-8 text-center">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 mb-6">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Meet Our
                <span className="block text-blue-600">
                  Leadership Team
                </span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member, index) => (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-lg hover:border-blue-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${600 + index * 150}ms` }}
                >
                  <div className="relative p-8 text-center">
                    <div className="mx-auto h-24 w-24 rounded-full bg-blue-600 mb-6 flex items-center justify-center">
                      <UserGroupIcon className="h-12 w-12 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-12 lg:p-16">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Join Our
                  <span className="block">Mission?</span>
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Partner with us to transform education management in your institution.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-all hover:bg-gray-100"
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">TSMS</span>
              </div>
              <p className="text-gray-600 mb-2">Empowering education through technology</p>
              <p className="text-sm text-gray-500">© 2024 Teleparenting School Management System</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
