"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Contact;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
function Contact() {
    const [isLoaded, setIsLoaded] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        email: "",
        school: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setIsLoaded(true);
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert("Thank you for contacting us! We'll get back to you within 24 hours.");
        setFormData({ name: "", email: "", school: "", message: "" });
        setIsSubmitting(false);
    };
    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    const handleTextareaChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    const contactInfo = [
        {
            icon: outline_1.EnvelopeIcon,
            title: "Email Us",
            content: "support@tsms.com",
            description: "Get support within 24 hours"
        },
        {
            icon: outline_1.PhoneIcon,
            title: "Call Us",
            content: "+1 (555) 123-4567",
            description: "Mon-Fri, 9AM-6PM EST"
        },
        {
            icon: outline_1.BuildingOfficeIcon,
            title: "Visit Us",
            content: "123 Tech Street, Silicon Valley, CA",
            description: "Schedule a meeting with our team"
        }
    ];
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
    ];
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-white", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10", children: [(0, jsx_runtime_1.jsx)("nav", { className: "border-b border-gray-200 bg-white", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between h-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.SparklesIcon, { className: "h-6 w-6 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold text-gray-900", children: "TSMS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Teleparenting School Management" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden md:flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "Home" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/about", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "About Us" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/contact", className: "text-blue-600 text-sm font-medium", children: "Contact Us" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/signin", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "Sign In" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/auth/signin", className: "group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700", children: ["Get Started", (0, jsx_runtime_1.jsx)(outline_1.ArrowRightIcon, { className: "ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" })] })] })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("h1", { className: `text-5xl lg:text-7xl font-bold text-gray-900 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: ["Get in", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Touch With Us" })] }), (0, jsx_runtime_1.jsx)("p", { className: `mx-auto mt-6 max-w-3xl text-lg lg:text-xl text-gray-600 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: "Have questions about TSMS? Our team is here to help you transform your school's education management experience." })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24 bg-gray-50", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: (0, jsx_runtime_1.jsx)("div", { className: "grid gap-8 md:grid-cols-3", children: contactInfo.map((info, index) => {
                                const Icon = info.icon;
                                return ((0, jsx_runtime_1.jsx)("div", { className: `group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-lg hover:border-blue-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`, style: { transitionDelay: `${400 + index * 100}ms` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "relative p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 mb-6", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-8 w-8 text-white" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: info.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-blue-600 font-medium mb-2", children: info.content }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-sm", children: info.description })] }) }, index));
                            }) }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-16 lg:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl font-bold text-gray-900 mb-8", children: ["Send Us a", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Message" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Full Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: "name", name: "name", required: true, value: formData.name, onChange: handleInputChange, className: "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", placeholder: "John Doe" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address *" }), (0, jsx_runtime_1.jsx)("input", { type: "email", id: "email", name: "email", required: true, value: formData.email, onChange: handleInputChange, className: "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", placeholder: "john@example.com" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "school", className: "block text-sm font-medium text-gray-700 mb-2", children: "School/Organization" }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: "school", name: "school", value: formData.school, onChange: handleInputChange, className: "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all", placeholder: "Lincoln High School" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 mb-2", children: "Message *" }), (0, jsx_runtime_1.jsx)("textarea", { id: "message", name: "message", required: true, rows: 5, value: formData.message, onChange: handleTextareaChange, className: "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none", placeholder: "Tell us how we can help your school..." })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: isSubmitting, className: "group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed", children: [isSubmitting ? "Sending..." : "Send Message", (0, jsx_runtime_1.jsx)(outline_1.ArrowRightIcon, { className: "ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl font-bold text-gray-900 mb-8", children: ["Our", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Global Offices" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: offices.map((office, index) => ((0, jsx_runtime_1.jsx)("div", { className: `relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`, style: { transitionDelay: `${600 + index * 150}ms` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "relative p-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: office.city }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-3", children: [(0, jsx_runtime_1.jsx)(outline_1.BuildingOfficeIcon, { className: "h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: office.address })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(outline_1.PhoneIcon, { className: "h-5 w-5 text-blue-600 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: office.phone })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(outline_1.ClockIcon, { className: "h-5 w-5 text-blue-600 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: office.hours })] })] })] }) }, index))) })] })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24 bg-gray-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-center mb-16", children: (0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl lg:text-5xl font-bold text-gray-900", children: ["Frequently Asked", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Questions" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: [
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
                                ].map((faq, index) => ((0, jsx_runtime_1.jsx)("div", { className: `relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`, style: { transitionDelay: `${800 + index * 100}ms` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "relative p-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: faq.question }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: faq.answer })] }) }, index))) })] }) }), (0, jsx_runtime_1.jsx)("footer", { className: "border-t border-gray-200 bg-white", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8 py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center space-x-3 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.SparklesIcon, { className: "h-5 w-5 text-white" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-gray-900", children: "TSMS" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-2", children: "Empowering education through technology" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "\u00A9 2024 Teleparenting School Management System" })] }) }) })] }) }));
}
//# sourceMappingURL=page.js.map