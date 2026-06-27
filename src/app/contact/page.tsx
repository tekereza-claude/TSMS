"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  SparklesIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClockIcon
} from "@heroicons/react/24/outline"

export default function Contact() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert("Thank you for contacting us! We'll get back to you within 24 hours.")
    setFormData({ name: "", email: "", school: "", message: "" })
    setIsSubmitting(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: "Email Us",
      content: "support@tsms.com",
      description: "Get support within 24 hours"
    },
    {
      icon: PhoneIcon,
      title: "Call Us",
      content: "+1 (555) 123-4567",
      description: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: BuildingOfficeIcon,
      title: "Visit Us",
      content: "123 Tech Street, Silicon Valley, CA",
      description: "Schedule a meeting with our team"
    }
  ]

  const offices = [
    {
      city: "Silicon Valley",
      address: "123 Tech Street, Suite 100",
      phone: "+1 (555) 123-4567",
      hours: "Mon-Fri 9AM-6PM PST"
    },
    {
      city: "New York",
      address: "456 Broadway, Suite 200",
      phone: "+1 (555) 987-6543",
      hours: "Mon-Fri 9AM-6PM EST"
    },
    {
      city: "London",
      address: "789 Oxford Street, Suite 300",
      phone: "+44 20 7123 4567",
      hours: "Mon-Fri 9AM-6PM GMT"
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
                <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">About Us</Link>
                <Link href="/contact" className="text-blue-600 text-sm font-medium">Contact Us</Link>
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
                Get in
                <span className="block text-blue-600">
                  Touch With Us
                </span>
              </h1>
              
              <p className={`mx-auto mt-6 max-w-3xl text-lg lg:text-xl text-gray-600 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Have questions about TSMS? Our team is here to help you transform your school's 
                education management experience.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
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
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h3>
                      <p className="text-blue-600 font-medium mb-2">{info.content}</p>
                      <p className="text-gray-600 text-sm">{info.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Form & Offices */}
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2">
              {/* Contact Form */}
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  Send Us a
                  <span className="block text-blue-600">
                    Message
                  </span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                      School/Organization
                    </label>
                    <input
                      type="text"
                      id="school"
                      name="school"
                      value={formData.school}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Lincoln High School"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleTextareaChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                      placeholder="Tell us how we can help your school..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              </div>

              {/* Offices */}
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  Our
                  <span className="block text-blue-600">
                    Global Offices
                  </span>
                </h2>
                
                <div className="space-y-6">
                  {offices.map((office, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: `${600 + index * 150}ms` }}
                    >
                      <div className="relative p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{office.city}</h3>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-600">{office.address}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <PhoneIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <p className="text-gray-600">{office.phone}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <ClockIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <p className="text-gray-600">{office.hours}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Frequently Asked
                <span className="block text-blue-600">
                  Questions
                </span>
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "How long does implementation take?",
                  answer: "Typically 2-4 weeks depending on school size and requirements."
                },
                {
                  question: "Do you provide training for staff?",
                  answer: "Yes, we provide comprehensive training for all user roles."
                },
                {
                  question: "Is my data secure?",
                  answer: "Absolutely! We use bank-level encryption and security protocols."
                },
                {
                  question: "Can parents access multiple children?",
                  answer: "Yes, parents can view all their children's profiles."
                }
              ].map((faq, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div className="relative p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              ))}
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
