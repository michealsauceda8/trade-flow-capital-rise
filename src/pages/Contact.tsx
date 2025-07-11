
import React, { useState } from 'react';
import { Mail, MessageCircle, Clock, Users, Send, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      info: "Available 24/7",
      action: "Start Chat",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      info: "Avg. response: 2 hours",
      action: "Send Email",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Phone,
      title: "Telegram",
      description: "Join our community for instant support",
      info: "5,000+ active members",
      action: "Join Telegram",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const contactInfo = [
    {
      icon: Clock,
      label: "Response Time",
      value: "Avg. 12 minutes",
      subtext: "24/7 support available"
    },
    {
      icon: Users,
      label: "Active Support",
      value: "15+ Agents",
      subtext: "Multilingual support"
    },
    {
      icon: MapPin,
      label: "Global Coverage",
      value: "Worldwide",
      subtext: "All timezones covered"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get In <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Have questions about funding? Need help with your application? Our support team is here to help you succeed.
            </p>
          </div>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {supportOptions.map((option, index) => (
              <Card key={index} className="bg-slate-800/50 backdrop-blur-lg border-slate-700 hover:border-slate-600 transition-all duration-300 hover:transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <option.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{option.title}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-400 mb-4">{option.info}</div>
                  <Button className={`w-full bg-gradient-to-r ${option.color} hover:opacity-90 text-white`}>
                    {option.action}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Mail className="mr-3 h-6 w-6 text-blue-400" />
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Subject
                    </label>
                    <Select onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="application">Application Support</SelectItem>
                        <SelectItem value="funding">Funding Questions</SelectItem>
                        <SelectItem value="technical">Technical Issues</SelectItem>
                        <SelectItem value="legal">Legal Inquiries</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Message
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 text-lg font-semibold"
                  >
                    Send Message
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Stats */}
              <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Support Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                          <info.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-slate-300 text-sm">{info.label}</div>
                          <div className="text-white font-semibold text-lg">{info.value}</div>
                          <div className="text-slate-400 text-xs">{info.subtext}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Quick Links */}
              <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Quick Help</CardTitle>
                  <CardDescription className="text-slate-300">
                    Find answers to common questions instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <a href="/#faq" className="block p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="text-white font-medium">How do I get funded?</div>
                      <div className="text-slate-400 text-sm">Learn about our funding process</div>
                    </a>
                    <a href="/#faq" className="block p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="text-white font-medium">Is my wallet secure?</div>
                      <div className="text-slate-400 text-sm">Security and privacy information</div>
                    </a>
                    <a href="/#faq" className="block p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="text-white font-medium">Profit sharing details</div>
                      <div className="text-slate-400 text-sm">Understanding our profit splits</div>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-red-400" />
                    Emergency Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-4">
                    For urgent issues affecting your funded account or suspected security breaches:
                  </p>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Emergency Contact
                    <Phone className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
