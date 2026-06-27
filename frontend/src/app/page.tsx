"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  EyeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import LanguageToggle from "@/components/LanguageToggle"

export default function Home() {
  const { t } = useLanguage()
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentPhrase, setCurrentPhrase] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
    
    // Rotate phrases every 3 seconds
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % 2)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const phrases = [
    { text: t.heroPhrase1, target: t.heroTagForSchools },
    { text: t.heroPhrase2, target: t.heroTagForParents },
  ]

  const features = [
    {
      icon: BuildingOfficeIcon,
      title: "School Onboarding",
      description: t.featuresDesc,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: UserGroupIcon,
      title: "Smart Chatboard",
      description: t.featuresDesc,
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      icon: EyeIcon,
      title: "Real-Time Tracking",
      description: t.featuresDesc,
      gradient: "from-emerald-500 to-teal-500"
    }
  ]

  const capabilities = [
    {
      icon: AcademicCapIcon,
      title: "School Management",
      description: "Create, read, update, and delete school records with ease"
    },
    {
      icon: ChartBarIcon,
      title: "User Administration",
      description: "Manage teachers, students, and parent accounts"
    },
    {
      icon: ShieldCheckIcon,
      title: "Classroom Control",
      description: "Organize classes, subjects, and schedules"
    },
    {
      icon: SparklesIcon,
      title: "Grade Operations",
      description: "Full CRUD for student grades and assessments"
    },
    {
      icon: StarIcon,
      title: "Data Management",
      description: "Complete control over all school data and records"
    },
    {
      icon: CheckCircleIcon,
      title: "System Settings",
      description: "Configure platform settings and permissions"
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
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">{t.home}</Link>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">{t.about}</Link>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">{t.contact}</Link>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageToggle />
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  {t.signIn}
                </Link>
                <Link
                  href="/auth/signin"
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  {t.getStarted}
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
              <div className={`inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <SparklesIcon className="mr-2 h-4 w-4 text-blue-600" />
                {phrases[currentPhrase].target}
              </div>
              
              <h1 className={`mt-8 text-5xl lg:text-7xl font-bold text-gray-900 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {t.heroTransform}
                <span className="block text-blue-600 relative h-1em overflow-hidden inline-block w-full text-center">
                  <div 
                    className="flex transition-transform duration-700 ease-in-out" 
                    style={{ 
                      transform: `translateX(-${currentPhrase * 100}%)`
                    }}
                  >
                    {phrases.map((phrase, index) => (
                      <div key={index} className="h-1em flex items-center justify-center flex-shrink-0 w-full">
                        {phrase.text}
                      </div>
                    ))}
                  </div>
                </span>
              </h1>
              
              <p className={`mx-auto mt-6 max-w-2xl text-lg lg:text-xl text-gray-600 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {t.heroSubtitle}
              </p>

              <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Link
                  href="/auth/signin"
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                  {t.login}
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="group relative inline-flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg"
                >
                  {t.initiatePartnership}
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                {t.featuresTitle}
                <span className="block text-blue-600">
                  {t.featuresSubtitle}
                </span>
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                {t.featuresDesc}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const getAdminRoute = (title: string) => {
                  switch (title) {
                    case "School Onboarding":
                      return "/super-admin#schools"
                    case "Smart Chatboard":
                      return "/super-admin#schools"
                    case "Real-Time Tracking":
                      return "/super-admin#overview"
                    default:
                      return "/super-admin"
                  }
                }
                return (
                  <Link
                    key={index}
                    href={getAdminRoute(feature.title)}
                    className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-xl hover:border-blue-400 hover:scale-105 cursor-pointer ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${800 + index * 200}ms` }}
                  >
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 mb-6 group-hover:bg-blue-700 transition-colors`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">{feature.description}</p>
                    
                    <div className="mt-6 flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.goToAdmin}
                      <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                  {t.whyChoose}
                  <span className="block text-blue-600">
                    {t.whyChooseSub}
                  </span>
                </h2>
                <p className="text-lg text-gray-600 mb-12">
                  {t.whyChooseDesc}
                </p>
                
                <div className="space-y-6">
                  {capabilities.slice(0, 3).map((capability, index) => {
                    const Icon = capability.icon
                    const getCapabilityRoute = (title: string) => {
                      switch (title) {
                        case "School Management":
                          return "/super-admin#schools"
                        case "User Administration":
                          return "/super-admin#schools"
                        case "Classroom Control":
                          return "/super-admin#schools"
                        case "Grade Operations":
                          return "/super-admin#overview"
                        case "Data Management":
                          return "/super-admin#overview"
                        case "System Settings":
                          return "/super-admin#settings"
                        default:
                          return "/super-admin"
                      }
                    }
                    return (
                      <Link
                        key={index}
                        href={getCapabilityRoute(capability.title)}
                        className="group flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex-shrink-0">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 group-hover:bg-blue-700 transition-colors">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{capability.title}</h3>
                          <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{capability.description}</p>
                          
                          <div className="mt-2 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.manageInAdmin}
                            <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="relative">
                <div className="relative border border-gray-200 bg-gray-50 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.platformCapabilities}</h3>
                  <div className="space-y-4">
                    {capabilities.slice(3).map((capability, index) => {
                      const Icon = capability.icon
                      const getCapabilityRoute = (title: string) => {
                        switch (title) {
                          case "School Management":
                            return "/super-admin#schools"
                          case "User Administration":
                            return "/super-admin#schools"
                          case "Classroom Control":
                            return "/super-admin#schools"
                          case "Grade Operations":
                            return "/super-admin#overview"
                          case "Data Management":
                            return "/super-admin#overview"
                          case "System Settings":
                            return "/super-admin#settings"
                          default:
                            return "/super-admin"
                        }
                      }
                      return (
                        <Link
                          key={index}
                          href={getCapabilityRoute(capability.title)}
                          className="group flex items-center space-x-3 p-4 rounded-xl bg-white border border-gray-200 transition-all duration-300 hover:border-blue-400 hover:shadow-md hover:bg-blue-50 cursor-pointer"
                        >
                          <Icon className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{capability.title}</h4>
                            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{capability.description}</p>
                            
                            <div className="mt-1 flex items-center text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              {t.configure}
                              <ArrowRightIcon className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-12 lg:p-16">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  {t.ctaTitle}
                  <span className="block">{t.ctaSubtitle}</span>
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  {t.ctaDesc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">TSMS</span>
                </div>
                <p className="text-gray-600 mb-4">Empowering education through technology</p>
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">support@tsms.com</span>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/#features" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Connect</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.067-.06-1.407-.06-4.123v-.08c0-2.643.013-2.987.06-4.043.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 017.978 3.78c.636-.247 1.363-.416 2.427-.465 1.067-.048 1.407-.06 4.123-.06h.08zM8.548 4.848c-.636 0-1.152.516-1.152 1.152s.516 1.152 1.152 1.152 1.152-.516 1.152-1.152S9.184 4.848 8.548 4.848zm8.208 0c-.636 0-1.152.516-1.152 1.152s.516 1.152 1.152 1.152 1.152-.516 1.152-1.152S17.392 4.848 16.756 4.848zM12 8.548c-1.976 0-3.576 1.6-3.576 3.576s1.6 3.576 3.576 3.576 3.576-1.6 3.576-3.576S13.976 8.548 12 8.548zm0 5.904c-1.296 0-2.328-1.032-2.328-2.328s1.032-2.328 2.328-2.328 2.328 1.032 2.328 2.328-1.032 2.328-2.328 2.328z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-500">© 2024 Teleparenting School Management System. All rights reserved.</p>
                <div className="mt-4 md:mt-0">
                  <Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600 transition-colors mr-6">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
