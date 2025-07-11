
import React from 'react';
import { Star, Quote, TrendingUp } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Alex Chen",
      role: "Day Trader",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "Got $50K in funding after showing $5K in my wallet! The process was incredibly smooth and transparent.",
      profit: "+$23,450",
      rating: 5
    },
    {
      name: "Sarah Williams",
      role: "Swing Trader",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      content: "Finally, a funding platform that doesn't require months of evaluation. Started trading the same week I applied!",
      profit: "+$18,250",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Crypto Trader",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: "The 90% profit split is unbeatable. I've made more in 3 months than my entire previous year of trading.",
      profit: "+$41,800",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What Our <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Traders Say</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join thousands of successful traders who've transformed their trading careers with our funding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-600 hover:border-slate-500 transition-all duration-300 hover:transform hover:-translate-y-2"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity">
                <Quote className="h-8 w-8 text-blue-400" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-slate-300 text-lg leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Profit Badge */}
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-bold text-lg">{testimonial.profit}</span>
                <span className="text-slate-400 text-sm">in profits</span>
              </div>

              {/* Author */}
              <div className="flex items-center space-x-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/50"
                />
                <div>
                  <h4 className="text-white font-semibold">{testimonial.name}</h4>
                  <p className="text-slate-400 text-sm">{testimonial.role}</p>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">98%</div>
            <div className="text-slate-400">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">$2.5M</div>
            <div className="text-slate-400">Avg Monthly Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">24hrs</div>
            <div className="text-slate-400">Avg Approval</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">5,000+</div>
            <div className="text-slate-400">Active Traders</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
